import UserService from "#service/userService.js";
import UserRepository from "#repository/userRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import ApiError from "#shared/utils/error.js";
import supabase from "#lib/supabase.js";
import logger from "#app/logger.js";

// --- Mocks ---
jest.mock("#repository/userRepository.js");
jest.mock("#repository/shiftRepository.js");
jest.mock("#repository/notificationRepository.js");

jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn(),
  }));
});

jest.mock("#lib/supabase.js", () => ({
  auth: {
    signInWithOtp: jest.fn(),
    admin: {
      inviteUserByEmail: jest.fn(),
    },
  },
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("UserService", () => {
  let service;
  let mockUserRepo;
  let mockShiftRepo;
  let mockNotifRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();
    
    mockUserRepo = UserRepository.mock.instances[0];
    mockShiftRepo = ShiftRepository.mock.instances[0];
    mockNotifRepo = NotificationRepository.mock.instances[0];
  });

  // ============================================================
  // createUser
  // ============================================================
  describe("createUser", () => {
    const payload = {
      fullName: "Budi Santoso",
      email: "budi@example.com",
      phone: "08123456789",
      role: "MECHANIC",
    };

    beforeEach(() => {
      mockUserRepo.isEmailExists.mockResolvedValue(false);
      mockUserRepo.isPhoneExists.mockResolvedValue(false);
      mockUserRepo.findByRole.mockResolvedValue([{ id: "admin1", isActive: true }]);
      mockUserRepo.findById.mockResolvedValue(null);
      supabase.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      });
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should create user successfully and notify admins", async () => {
      const result = await service.createUser(payload);

      expect(result.id).toBe("u1");
      expect(result.email).toBe(payload.email);
      expect(result.role).toBe(payload.role);
      
      expect(supabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        payload.email,
        expect.objectContaining({ data: { fullName: payload.fullName, phone: payload.phone, role: payload.role } })
      );
      
      // Cek notifikasi dipanggil (untuk user baru dan admin)
      expect(mockNotifRepo.create).toHaveBeenCalledTimes(2); 
    });

    it("should throw Forbidden if role is ADMIN", async () => {
      await expect(service.createUser({ ...payload, role: "ADMIN" })).rejects.toThrow(ApiError);
    });

    it("should throw BadRequest if email is empty", async () => {
      await expect(service.createUser({ ...payload, email: "" })).rejects.toThrow(ApiError);
    });

    it("should throw Conflict if email already exists", async () => {
      mockUserRepo.isEmailExists.mockResolvedValue(true);
      await expect(service.createUser(payload)).rejects.toThrow(ApiError);
    });

    it("should throw Conflict if phone already exists", async () => {
      mockUserRepo.isPhoneExists.mockResolvedValue(true);
      await expect(service.createUser(payload)).rejects.toThrow(ApiError);
    });

    it("should throw Internal Error if Supabase auth fails", async () => {
      supabase.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: null,
        error: { message: "Supabase error" },
      });
      await expect(service.createUser(payload)).rejects.toThrow(ApiError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ============================================================
  // resendMagicLink & #sendMagicLink
  // ============================================================
  describe("resendMagicLink", () => {
    it("should resend magic link successfully", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", email: "test@test.com", isAuthenticated: false });
      supabase.auth.signInWithOtp.mockResolvedValue({ error: null });

      const result = await service.resendMagicLink("u1");

      expect(result.message).toContain("dikirim ulang");
      expect(supabase.auth.signInWithOtp).toHaveBeenCalled();
    });

    it("should throw 404 if user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(service.resendMagicLink("u99")).rejects.toThrow(ApiError);
    });

    it("should throw 400 if user has no email", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", email: null });
      await expect(service.resendMagicLink("u1")).rejects.toThrow(ApiError);
    });

    it("should throw 409 if user is already authenticated", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", email: "test@test.com", isAuthenticated: true });
      await expect(service.resendMagicLink("u1")).rejects.toThrow(ApiError);
    });

    it("should throw 429 TooManyRequests if rate limited by Supabase", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", email: "test@test.com", isAuthenticated: false });
      supabase.auth.signInWithOtp.mockResolvedValue({
        error: { code: "over_email_send_rate_limit", message: "Rate limit" },
      });

      await expect(service.resendMagicLink("u1")).rejects.toMatchObject({ statusCode: 429 });
    });
  });

  // ============================================================
  // Getters (getUserById, getUserByEmail, getUserByPhone)
  // ============================================================
  describe("Getters (ById, ByEmail, ByPhone)", () => {
    it("should return user by ID", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1" });
      const user = await service.getUserById("u1");
      expect(user.id).toBe("u1");
    });

    it("should return user by Email", async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ email: "test@test.com" });
      const user = await service.getUserByEmail("test@test.com");
      expect(user.email).toBe("test@test.com");
    });

    it("should return user by Phone", async () => {
      mockUserRepo.findByPhone.mockResolvedValue({ phone: "0812" });
      const user = await service.getUserByPhone("0812");
      expect(user.phone).toBe("0812");
    });

    it("should throw 404 if not found across all getters", async () => {
      mockUserRepo.findById.mockResolvedValue(null);
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.findByPhone.mockResolvedValue(null);

      await expect(service.getUserById("u99")).rejects.toThrow(ApiError);
      await expect(service.getUserByEmail("x@x.com")).rejects.toThrow(ApiError);
      await expect(service.getUserByPhone("000")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // List Fetchers (getUsers, getEmployees, getAdmins)
  // ============================================================
  describe("List Fetchers", () => {
    it("should return users with pagination", async () => {
      mockUserRepo.findMany.mockResolvedValue({ data: [], metadata: { total: 0 } });
      const result = await service.getUsers({ role: "CASHIER" });
      expect(result.data).toEqual([]);
      expect(mockUserRepo.findMany).toHaveBeenCalled();
    });

    it("should return employees", async () => {
      mockUserRepo.findEmployees.mockResolvedValue({ data: [], metadata: { total: 0 } });
      await service.getEmployees();
      expect(mockUserRepo.findEmployees).toHaveBeenCalled();
    });

    it("should return admins", async () => {
      mockUserRepo.findByRole.mockResolvedValue([{ id: "admin1" }]);
      const result = await service.getAdmins();
      expect(result).toHaveLength(1);
    });
    
    it("should return users by role", async () => {
      mockUserRepo.findByRole.mockResolvedValue([{ id: "mech1" }]);
      const result = await service.getUsersByRole("MECHANIC");
      expect(result).toHaveLength(1);
      expect(mockUserRepo.findByRole).toHaveBeenCalledWith("MECHANIC");
    });
  });

  // ============================================================
  // updateUser
  // ============================================================
  describe("updateUser", () => {
    const existingUser = {
      id: "u1",
      fullName: "Old Name",
      phone: "0811",
      role: "CASHIER",
      isActive: true,
    };

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.update.mockImplementation((id, data) => Promise.resolve({ ...existingUser, ...data }));
    });

    it("should update user and send notification on change", async () => {
      mockUserRepo.isPhoneExists.mockResolvedValue(false);
      
      const payload = { fullName: "New Name", role: "MECHANIC", isActive: false };
      mockShiftRepo.hasActiveShift.mockResolvedValue(false); // Can be deactivated

      const result = await service.updateUser("u1", payload);
      
      expect(result.fullName).toBe("New Name");
      expect(result.role).toBe("MECHANIC");
      expect(result.isActive).toBe(false);
      expect(mockUserRepo.update).toHaveBeenCalled();
      expect(mockNotifRepo.create).toHaveBeenCalled(); // Profil Diperbarui
    });

    it("should throw 404 if user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(service.updateUser("u99", {})).rejects.toThrow(ApiError);
    });

    it("should throw 403 if trying to change an ADMIN role", async () => {
      mockUserRepo.findById.mockResolvedValue({ ...existingUser, role: "ADMIN" });
      await expect(service.updateUser("u1", { role: "CASHIER" })).rejects.toThrow(ApiError);
    });

    it("should throw 403 if changing to an invalid role", async () => {
      await expect(service.updateUser("u1", { role: "UNKNOWN" })).rejects.toThrow(ApiError);
    });

    it("should throw 409 if new phone already exists", async () => {
      mockUserRepo.isPhoneExists.mockResolvedValue(true);
      await expect(service.updateUser("u1", { phone: "0822" })).rejects.toThrow(ApiError);
    });

    it("should throw 409 if deactivating user with active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);
      await expect(service.updateUser("u1", { isActive: false })).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // deleteUser
  // ============================================================
  describe("deleteUser", () => {
    const user = { id: "u1", role: "CASHIER", fullName: "Test" };

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(user);
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);
      mockUserRepo.hasRelations.mockResolvedValue(false);
      mockUserRepo.delete.mockResolvedValue();
      mockUserRepo.findByRole.mockResolvedValue([{ id: "admin1", isActive: true }]);
    });

    it("should delete user and notify admins", async () => {
      await service.deleteUser("u1");
      expect(mockUserRepo.delete).toHaveBeenCalledWith("u1");
      expect(mockNotifRepo.create).toHaveBeenCalled(); // Notify Admin
    });

    it("should throw 404 if user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(service.deleteUser("u99")).rejects.toThrow(ApiError);
    });

    it("should throw 403 if user is ADMIN", async () => {
      mockUserRepo.findById.mockResolvedValue({ ...user, role: "ADMIN" });
      await expect(service.deleteUser("u1")).rejects.toThrow(ApiError);
    });

    it("should throw 409 if user has active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);
      await expect(service.deleteUser("u1")).rejects.toThrow(ApiError);
    });

    it("should throw 409 if user has relations (orders/expenses)", async () => {
      mockUserRepo.hasRelations.mockResolvedValue(true);
      await expect(service.deleteUser("u1")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // validateUserEmail
  // ============================================================
  describe("validateUserEmail", () => {
    it("should return user if valid", async () => {
      const user = { email: "test@test.com", isActive: true, isAuthenticated: true };
      mockUserRepo.findByEmail.mockResolvedValue(user);
      
      const result = await service.validateUserEmail("test@test.com");
      expect(result).toEqual(user);
    });

    it("should throw 404 if not registered", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      await expect(service.validateUserEmail("x@x.com")).rejects.toThrow(ApiError);
    });

    it("should throw 403 if inactive", async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ isActive: false });
      await expect(service.validateUserEmail("x@x.com")).rejects.toThrow(ApiError);
    });

    it("should throw 403 if not authenticated", async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ isActive: true, isAuthenticated: false });
      await expect(service.validateUserEmail("x@x.com")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // Availability Checkers
  // ============================================================
  describe("checkEmailExists & checkPhoneExists", () => {
    it("should return correct status for checkEmailExists", async () => {
      mockUserRepo.isEmailExists.mockResolvedValue(true);
      const result = await service.checkEmailExists("test@test.com");
      expect(result.exists).toBe(true);
      expect(result.message).toContain("sudah terdaftar");
    });

    it("should return correct status for checkPhoneExists", async () => {
      mockUserRepo.isPhoneExists.mockResolvedValue(false);
      const result = await service.checkPhoneExists("0812");
      expect(result.exists).toBe(false);
      expect(result.message).toContain("tersedia");
    });
  });
});