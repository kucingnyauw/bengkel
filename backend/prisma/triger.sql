-- ============================================================
-- SUPABASE SQL TRIGGERS - BENGKEL POS (ULTIMATE SECURE VERSION)
-- ============================================================

-- ============================================================
-- 0. Setup: Extension & Table tambahan
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Audit log table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tableName" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  action TEXT NOT NULL,
  "oldValues" JSONB,
  "newValues" JSONB,
  "changedById" TEXT,
  "changedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON "AuditLog" ("tableName", "recordId");
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON "AuditLog" ("changedAt");
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON "AuditLog" (action);

-- ============================================================
-- 1. Trigger: Sinkronisasi user dari auth.users ke User
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_auth_user();

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_phone TEXT;
  user_fullname TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'CASHIER');
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_fullname := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', 'User');

  IF user_role NOT IN ('ADMIN', 'CASHIER', 'MECHANIC') THEN
    user_role := 'CASHIER';
  END IF;

  INSERT INTO "User" (id, email, "fullName", phone, role, "isActive", "isAuthenticated", "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    user_fullname,
    user_phone,
    user_role::"Role",
    true,
    false,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO "AuditLog" ("tableName", "recordId", action, "newValues")
  VALUES (
    'User', NEW.id, 'USER_CREATED_AUTH',
    jsonb_build_object('email', NEW.email, 'fullName', user_fullname, 'role', user_role, 'phone', user_phone)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_auth_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION handle_new_auth_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION handle_new_auth_user() FROM anon;
REVOKE EXECUTE ON FUNCTION handle_new_auth_user() FROM authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================
-- 2. Trigger: Auto Update updatedAt
-- ============================================================
DROP TRIGGER IF EXISTS product_updated_trigger ON "Product";
DROP TRIGGER IF EXISTS expense_updated_trigger ON "Expense";
DROP TRIGGER IF EXISTS user_updated_trigger ON "User";
DROP TRIGGER IF EXISTS order_updated_trigger ON "Order";
DROP FUNCTION IF EXISTS update_timestamp();

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER product_updated_trigger BEFORE UPDATE ON "Product" FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER expense_updated_trigger BEFORE UPDATE ON "Expense" FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER user_updated_trigger BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER order_updated_trigger BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 3. Trigger: Cegah hapus user dengan relasi aktif
-- ============================================================
DROP TRIGGER IF EXISTS prevent_user_delete_trigger ON "User";
DROP FUNCTION IF EXISTS prevent_user_delete();

CREATE OR REPLACE FUNCTION prevent_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Order" WHERE "cashierId" = OLD.id AND "deletedAt" IS NULL LIMIT 1) THEN
    RAISE EXCEPTION 'Tidak dapat menghapus user. User masih memiliki pesanan aktif.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM "Shift" WHERE "cashierId" = OLD.id AND status = 'OPEN' LIMIT 1) THEN
    RAISE EXCEPTION 'Tidak dapat menghapus user. User masih memiliki shift aktif.';
  END IF;

  INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues")
  VALUES (
    'User', OLD.id, 'USER_DELETED',
    jsonb_build_object('email', OLD.email, 'fullName', OLD."fullName", 'role', OLD.role, 'isActive', OLD."isActive")
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER prevent_user_delete_trigger
  BEFORE DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION prevent_user_delete();

-- ============================================================
-- 4. Trigger: Hapus user di auth.users saat public."User" dihapus
-- ============================================================
DROP TRIGGER IF EXISTS on_public_user_deleted ON "User";
DROP FUNCTION IF EXISTS delete_auth_user();

CREATE OR REPLACE FUNCTION delete_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id::uuid;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION delete_auth_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION delete_auth_user() FROM anon;
REVOKE EXECUTE ON FUNCTION delete_auth_user() FROM authenticated;

CREATE TRIGGER on_public_user_deleted
  AFTER DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION delete_auth_user();

-- ============================================================
-- 5. Trigger: Cascade Soft Delete Order
-- ============================================================
DROP TRIGGER IF EXISTS order_soft_delete_trigger ON "Order";
DROP FUNCTION IF EXISTS cascade_soft_delete_order();

CREATE OR REPLACE FUNCTION cascade_soft_delete_order()
RETURNS TRIGGER AS $$
DECLARE
  cancelled_payments INT;
  closed_assignments INT;
BEGIN
  IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
    WITH updated_payments AS (
      UPDATE "Payment" SET status = 'REFUNDED' WHERE "orderId" = NEW.id AND status = 'PAID' RETURNING id
    ) SELECT COUNT(*) INTO cancelled_payments FROM updated_payments;
    
    WITH updated_assignments AS (
      UPDATE "MechanicAssignment" SET "endAt" = NOW() WHERE "orderItemId" IN (SELECT id FROM "OrderItem" WHERE "orderId" = NEW.id) AND "endAt" IS NULL RETURNING id
    ) SELECT COUNT(*) INTO closed_assignments FROM updated_assignments;
    
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES (
      'Order', NEW.id, 'ORDER_SOFT_DELETED',
      jsonb_build_object('status', OLD.status, 'deletedAt', OLD."deletedAt"),
      jsonb_build_object('deletedAt', NEW."deletedAt", 'orderNumber', NEW."orderNumber", 'total', NEW.total, 'cancelledPayments', cancelled_payments, 'closedMechanicAssignments', closed_assignments)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in cascade_soft_delete_order for order %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER order_soft_delete_trigger
  AFTER UPDATE OF "deletedAt" ON "Order"
  FOR EACH ROW WHEN (NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL)
  EXECUTE FUNCTION cascade_soft_delete_order();

-- ============================================================
-- 6. Trigger: Audit Product Changes
-- ============================================================
DROP TRIGGER IF EXISTS product_audit_trigger ON "Product";
DROP FUNCTION IF EXISTS audit_product_changes();

CREATE OR REPLACE FUNCTION audit_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price IS DISTINCT FROM OLD.price OR NEW.cost IS DISTINCT FROM OLD.cost THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('Product', NEW.id, 'PRODUCT_PRICE_CHANGE', jsonb_build_object('price', OLD.price, 'cost', OLD.cost), jsonb_build_object('price', NEW.price, 'cost', NEW.cost, 'productName', NEW.name, 'sku', NEW.sku, 'margin', NEW.price - NEW.cost, 'marginPercentage', ROUND(((NEW.price - NEW.cost)::NUMERIC / NULLIF(NEW.price, 0)) * 100, 2)));
  END IF;

  IF NEW.stock IS DISTINCT FROM OLD.stock THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('Product', NEW.id, 'PRODUCT_STOCK_CHANGE', jsonb_build_object('stock', OLD.stock), jsonb_build_object('stock', NEW.stock, 'productName', NEW.name, 'sku', NEW.sku, 'change', NEW.stock - OLD.stock));
  END IF;

  IF NEW.name IS DISTINCT FROM OLD.name THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('Product', NEW.id, 'PRODUCT_NAME_CHANGE', jsonb_build_object('name', OLD.name), jsonb_build_object('name', NEW.name, 'sku', NEW.sku));
  END IF;

  IF NEW."isActive" IS DISTINCT FROM OLD."isActive" THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('Product', NEW.id, CASE WHEN NEW."isActive" THEN 'PRODUCT_ACTIVATED' ELSE 'PRODUCT_DEACTIVATED' END, jsonb_build_object('isActive', OLD."isActive"), jsonb_build_object('isActive', NEW."isActive", 'productName', NEW.name, 'sku', NEW.sku));
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_product_changes: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER product_audit_trigger AFTER UPDATE ON "Product" FOR EACH ROW EXECUTE FUNCTION audit_product_changes();

-- ============================================================
-- 7. Trigger: Audit User Status & Role Changes
-- ============================================================
DROP TRIGGER IF EXISTS user_status_change_trigger ON "User";
DROP FUNCTION IF EXISTS audit_user_changes();

CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."isActive" IS DISTINCT FROM OLD."isActive" THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('User', NEW.id, CASE WHEN NEW."isActive" THEN 'USER_ACTIVATED' ELSE 'USER_DEACTIVATED' END, jsonb_build_object('isActive', OLD."isActive"), jsonb_build_object('isActive', NEW."isActive", 'email', NEW.email, 'fullName', NEW."fullName", 'role', NEW.role));
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('User', NEW.id, 'USER_ROLE_CHANGE', jsonb_build_object('role', OLD.role), jsonb_build_object('role', NEW.role, 'email', NEW.email, 'fullName', NEW."fullName"));
  END IF;

  IF NEW."fullName" IS DISTINCT FROM OLD."fullName" THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('User', NEW.id, 'USER_NAME_CHANGE', jsonb_build_object('fullName', OLD."fullName"), jsonb_build_object('fullName', NEW."fullName", 'email', NEW.email));
  END IF;

  IF NEW.phone IS DISTINCT FROM OLD.phone THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('User', NEW.id, 'USER_PHONE_CHANGE', jsonb_build_object('phone', OLD.phone), jsonb_build_object('phone', NEW.phone, 'email', NEW.email));
  END IF;

  IF NEW."isAuthenticated" IS DISTINCT FROM OLD."isAuthenticated" THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('User', NEW.id, CASE WHEN NEW."isAuthenticated" THEN 'USER_AUTHENTICATED' ELSE 'USER_UNAUTHENTICATED' END, jsonb_build_object('isAuthenticated', OLD."isAuthenticated"), jsonb_build_object('isAuthenticated', NEW."isAuthenticated", 'email', NEW.email, 'fullName', NEW."fullName"));
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_user_changes: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER user_status_change_trigger AFTER UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION audit_user_changes();

-- ============================================================
-- 8. Trigger: Audit Order Status Changes
-- ============================================================
DROP TRIGGER IF EXISTS order_status_change_trigger ON "Order";
DROP FUNCTION IF EXISTS audit_order_status_change();

CREATE OR REPLACE FUNCTION audit_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('Order', NEW.id, 'ORDER_STATUS_CHANGE', jsonb_build_object('status', OLD.status), jsonb_build_object('status', NEW.status, 'orderNumber', NEW."orderNumber", 'total', NEW.total, 'cashierId', NEW."cashierId", 'customerId', NEW."customerId", 'vehicleId', NEW."vehicleId"));
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_order_status_change: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER order_status_change_trigger AFTER UPDATE OF status ON "Order" FOR EACH ROW WHEN (NEW.status IS DISTINCT FROM OLD.status) EXECUTE FUNCTION audit_order_status_change();

-- ============================================================
-- 9. Trigger: Audit Payment Changes
-- ============================================================
DROP TRIGGER IF EXISTS payment_audit_trigger ON "Payment";
DROP FUNCTION IF EXISTS audit_payment_changes();

CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "newValues")
    VALUES ('Payment', NEW.id, 'PAYMENT_CREATED', jsonb_build_object('orderId', NEW."orderId", 'method', NEW.method, 'amountPaid', NEW."amountPaid", 'change', NEW.change, 'status', NEW.status));
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('Payment', NEW.id, 'PAYMENT_STATUS_CHANGE', jsonb_build_object('status', OLD.status, 'method', OLD.method, 'amountPaid', OLD."amountPaid"), jsonb_build_object('status', NEW.status, 'method', NEW.method, 'amountPaid', NEW."amountPaid", 'orderId', NEW."orderId"));
  END IF;

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_payment_changes: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER payment_audit_trigger AFTER INSERT OR UPDATE ON "Payment" FOR EACH ROW EXECUTE FUNCTION audit_payment_changes();

-- ============================================================
-- 10. Trigger: Audit Expense Changes
-- ============================================================
DROP TRIGGER IF EXISTS expense_audit_trigger ON "Expense";
DROP FUNCTION IF EXISTS audit_expense_changes();

CREATE OR REPLACE FUNCTION audit_expense_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.amount IS DISTINCT FROM OLD.amount THEN
      INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
      VALUES ('Expense', NEW.id, 'EXPENSE_AMOUNT_CHANGE', jsonb_build_object('amount', OLD.amount), jsonb_build_object('amount', NEW.amount, 'title', NEW.title));
    END IF;
    IF NEW.category IS DISTINCT FROM OLD.category THEN
      INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
      VALUES ('Expense', NEW.id, 'EXPENSE_CATEGORY_CHANGE', jsonb_build_object('category', OLD.category), jsonb_build_object('category', NEW.category, 'title', NEW.title));
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_expense_changes: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER expense_audit_trigger AFTER UPDATE ON "Expense" FOR EACH ROW EXECUTE FUNCTION audit_expense_changes();

-- ============================================================
-- 11. Trigger: Audit Stock Movement (INSERT only)
-- ============================================================
DROP TRIGGER IF EXISTS stock_movement_audit_trigger ON "StockMovement";
DROP FUNCTION IF EXISTS audit_stock_movement();

CREATE OR REPLACE FUNCTION audit_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
  recorded_by_name TEXT;
BEGIN
  SELECT name INTO product_name FROM "Product" WHERE id = NEW."productId";
  SELECT "fullName" INTO recorded_by_name FROM "User" WHERE id = NEW."recordedById";

  INSERT INTO "AuditLog" ("tableName", "recordId", action, "newValues")
  VALUES ('StockMovement', NEW.id, 'STOCK_MOVEMENT_CREATED', jsonb_build_object('productId', NEW."productId", 'productName', product_name, 'quantity', NEW.quantity, 'type', NEW.type, 'sourceType', NEW."sourceType", 'recordedById', NEW."recordedById", 'recordedByName', recorded_by_name, 'orderItemId', NEW."orderItemId", 'note', NEW.note));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_stock_movement: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER stock_movement_audit_trigger AFTER INSERT ON "StockMovement" FOR EACH ROW EXECUTE FUNCTION audit_stock_movement();

-- ============================================================
-- 12. Trigger: Audit Shift Changes
-- ============================================================
DROP TRIGGER IF EXISTS shift_audit_trigger ON "Shift";
DROP FUNCTION IF EXISTS audit_shift_changes();

CREATE OR REPLACE FUNCTION audit_shift_changes()
RETURNS TRIGGER AS $$
DECLARE
  cashier_name TEXT;
BEGIN
  SELECT "fullName" INTO cashier_name FROM "User" WHERE id = COALESCE(NEW."cashierId", OLD."cashierId");

  IF TG_OP = 'INSERT' THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "newValues")
    VALUES ('Shift', NEW.id, 'SHIFT_OPENED', jsonb_build_object('cashierId', NEW."cashierId", 'cashierName', cashier_name, 'startingCash', NEW."startingCash", 'openedAt', NEW."openedAt"));
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'CLOSED' AND OLD.status = 'OPEN' THEN
    INSERT INTO "AuditLog" ("tableName", "recordId", action, "oldValues", "newValues")
    VALUES ('Shift', NEW.id, 'SHIFT_CLOSED', jsonb_build_object('status', OLD.status, 'cashSales', OLD."cashSales", 'endingCash', OLD."endingCash"), jsonb_build_object('status', NEW.status, 'cashierId', NEW."cashierId", 'cashierName', cashier_name, 'cashSales', NEW."cashSales", 'cashIn', NEW."cashIn", 'cashOut', NEW."cashOut", 'endingCash', NEW."endingCash", 'expectedCash', NEW."expectedCash", 'discrepancy', NEW.discrepancy, 'closedAt', NEW."closedAt"));
  END IF;

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in audit_shift_changes: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER shift_audit_trigger AFTER INSERT OR UPDATE ON "Shift" FOR EACH ROW EXECUTE FUNCTION audit_shift_changes();

-- ============================================================
-- 13. Trigger: Auto Delete Notifications (7 days read, 30 days unread)
-- ============================================================
DROP TRIGGER IF EXISTS notification_cleanup_trigger ON "Notification";
DROP FUNCTION IF EXISTS auto_delete_old_notifications();

CREATE OR REPLACE FUNCTION auto_delete_old_notifications()
RETURNS TRIGGER AS $$
DECLARE
  deleted_read INT;
  deleted_unread INT;
BEGIN
  WITH deleted AS (DELETE FROM "Notification" WHERE "createdAt" < NOW() - INTERVAL '7 days' AND "isRead" = true RETURNING id)
  SELECT COUNT(*) INTO deleted_read FROM deleted;
  
  WITH deleted AS (DELETE FROM "Notification" WHERE "createdAt" < NOW() - INTERVAL '30 days' AND "isRead" = false RETURNING id)
  SELECT COUNT(*) INTO deleted_unread FROM deleted;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER notification_cleanup_trigger AFTER INSERT ON "Notification" FOR EACH STATEMENT EXECUTE FUNCTION auto_delete_old_notifications();

-- ============================================================
-- 14. Function: Manual Cleanup (untuk cron job)
-- ============================================================
CREATE OR REPLACE FUNCTION manual_cleanup_old_data()
RETURNS TABLE(cleaned_table TEXT, deleted_count BIGINT) AS $$
DECLARE
  cnt BIGINT;
BEGIN
  WITH deleted AS (DELETE FROM "Notification" WHERE ("createdAt" < NOW() - INTERVAL '7 days' AND "isRead" = true) OR ("createdAt" < NOW() - INTERVAL '30 days' AND "isRead" = false) RETURNING *) SELECT COUNT(*) INTO cnt FROM deleted;
  IF cnt > 0 THEN cleaned_table := 'Notification'; deleted_count := cnt; RETURN NEXT; END IF;
  
  WITH deleted AS (DELETE FROM "AuditLog" WHERE "changedAt" < NOW() - INTERVAL '90 days' RETURNING *) SELECT COUNT(*) INTO cnt FROM deleted;
  IF cnt > 0 THEN cleaned_table := 'AuditLog'; deleted_count := cnt; RETURN NEXT; END IF;
  
  WITH deleted AS (DELETE FROM "Order" WHERE "deletedAt" IS NOT NULL AND "deletedAt" < NOW() - INTERVAL '180 days' RETURNING *) SELECT COUNT(*) INTO cnt FROM deleted;
  IF cnt > 0 THEN cleaned_table := 'Order'; deleted_count := cnt; RETURN NEXT; END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 15. Indexes untuk performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_notification_created_at_read ON "Notification" ("createdAt", "isRead");
CREATE INDEX IF NOT EXISTS idx_notification_user_created ON "Notification" ("userId", "createdAt" DESC);

-- ============================================================
-- 16. PERBAIKAN LINTER: Kunci Fungsi Eksternal/Lainnya
-- ============================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_product_price_change') THEN ALTER FUNCTION public.audit_product_price_change() SET search_path = public; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_order_total') THEN ALTER FUNCTION public.validate_order_total() SET search_path = public; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'periodic_notification_cleanup') THEN ALTER FUNCTION public.periodic_notification_cleanup() SET search_path = public; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_new_user') THEN ALTER FUNCTION public.notify_new_user() SET search_path = public; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_low_stock') THEN ALTER FUNCTION public.notify_low_stock() SET search_path = public; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_out_of_stock') THEN ALTER FUNCTION public.notify_out_of_stock() SET search_path = public; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_shift_opened') THEN ALTER FUNCTION public.notify_shift_opened() SET search_path = public; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_shift_closed') THEN ALTER FUNCTION public.notify_shift_closed() SET search_path = public; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_new_expense') THEN ALTER FUNCTION public.notify_new_expense() SET search_path = public; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_stock_adjustment') THEN ALTER FUNCTION public.notify_stock_adjustment() SET search_path = public; END IF;
END $$;