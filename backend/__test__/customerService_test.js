// __test__/customerService_test.js
import CustomerService from "#service/customerService.js";
import CustomerRepository from "#repository/customerRepository.js";
import ApiError from "#shared/utils/error.js";

// Mock repository
jest.mock("#repository/customerRepository.js");

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("CustomerService", () => {
  let service;
  let mockCustomerRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomerService();
    // Get the mock repository instance
    mockCustomerRepo = CustomerRepository.mock.instances[0];
  });

  // ============================================================
  // createCustomer
  // ============================================================
  describe("createCustomer", () => {
    it("should create customer with name and phone", async () => {
      const payload = { name: "Budi", phone: "08123456789" };
      const created = { id: "c1", name: "Budi", phone: "08123456789", createdAt: new Date() };
      mockCustomerRepo.create.mockResolvedValue(created);

      const result = await service.createCustomer(payload);
      expect(result).toEqual(created);
      expect(mockCustomerRepo.create).toHaveBeenCalledWith({ name: "Budi", phone: "08123456789" });
    });

    it("should create customer without phone", async () => {
      const payload = { name: "Ani" };
      const created = { id: "c2", name: "Ani", phone: null };
      mockCustomerRepo.create.mockResolvedValue(created);

      const result = await service.createCustomer(payload);
      expect(result.phone).toBeNull();
      expect(mockCustomerRepo.create).toHaveBeenCalledWith({ name: "Ani", phone: undefined });
    });
  });

  // ============================================================
  // upsertCustomer
  // ============================================================
  describe("upsertCustomer", () => {
    const payload = { name: "Budi", phone: "08123456789" };

    it("should update existing customer when phone exists", async () => {
      const existing = { id: "c1", name: "Budi Lama", phone: "08123456789" };
      const updated = { id: "c1", name: "Budi", phone: "08123456789" };
      mockCustomerRepo.findByPhone.mockResolvedValue(existing);
      mockCustomerRepo.upsert.mockResolvedValue(updated);

      const result = await service.upsertCustomer(payload);
      expect(result).toEqual(updated);
      expect(mockCustomerRepo.findByPhone).toHaveBeenCalledWith("08123456789");
      expect(mockCustomerRepo.upsert).toHaveBeenCalledWith(payload);
    });

    it("should create new customer when phone does not exist", async () => {
      const created = { id: "c2", name: "Budi", phone: "08123456789" };
      mockCustomerRepo.findByPhone.mockResolvedValue(null);
      mockCustomerRepo.upsert.mockResolvedValue(created);

      const result = await service.upsertCustomer(payload);
      expect(result).toEqual(created);
    });
  });

  // ============================================================
  // getCustomerById
  // ============================================================
  describe("getCustomerById", () => {
    it("should return customer when found", async () => {
      const customer = { id: "c1", name: "Budi", phone: "08123456789" };
      mockCustomerRepo.findById.mockResolvedValue(customer);

      const result = await service.getCustomerById("c1");
      expect(result).toEqual(customer);
      expect(mockCustomerRepo.findById).toHaveBeenCalledWith("c1");
    });

    it("should throw ApiError 404 when not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(service.getCustomerById("c99")).rejects.toThrow(ApiError);
      await expect(service.getCustomerById("c99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getCustomerByPhone
  // ============================================================
  describe("getCustomerByPhone", () => {
    it("should return customer when found by phone", async () => {
      const customer = { id: "c1", name: "Budi", phone: "08123456789" };
      mockCustomerRepo.findByPhone.mockResolvedValue(customer);

      const result = await service.getCustomerByPhone("08123456789");
      expect(result).toEqual(customer);
    });

    it("should throw ApiError 404 when phone not found", async () => {
      mockCustomerRepo.findByPhone.mockResolvedValue(null);

      await expect(service.getCustomerByPhone("000")).rejects.toThrow(ApiError);
      await expect(service.getCustomerByPhone("000")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getCustomers
  // ============================================================
  describe("getCustomers", () => {
    it("should return paginated customers", async () => {
      const repoResult = {
        data: [{ id: "c1", name: "Budi" }],
        metadata: { total: 1, currentPage: 1, itemsPerPage: 10, totalPages: 1 },
      };
      mockCustomerRepo.findMany.mockResolvedValue(repoResult);

      const result = await service.getCustomers({ page: 1, limit: 10 });
      expect(result).toEqual(repoResult);
      expect(result.data).toHaveLength(1);
      expect(mockCustomerRepo.findMany).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  // ============================================================
  // updateCustomer
  // ============================================================
  describe("updateCustomer", () => {
    const existing = { id: "c1", name: "Budi", phone: "08123456789" };

    it("should update customer name successfully", async () => {
      const payload = { name: "Budi Updated" };
      const updated = { id: "c1", name: "Budi Updated", phone: "08123456789" };

      mockCustomerRepo.findById.mockResolvedValue(existing);
      // phone not in payload -> isPhoneExists not called
      mockCustomerRepo.update.mockResolvedValue(updated);

      const result = await service.updateCustomer("c1", payload);
      expect(result).toEqual(updated);
      expect(mockCustomerRepo.update).toHaveBeenCalledWith("c1", payload);
    });

    it("should update customer phone when it is not taken", async () => {
      const payload = { phone: "08999999999" };
      const updated = { id: "c1", name: "Budi", phone: "08999999999" };

      mockCustomerRepo.findById.mockResolvedValue(existing);
      mockCustomerRepo.isPhoneExists.mockResolvedValue(false);
      mockCustomerRepo.update.mockResolvedValue(updated);

      const result = await service.updateCustomer("c1", payload);
      expect(result.phone).toBe("08999999999");
      expect(mockCustomerRepo.isPhoneExists).toHaveBeenCalledWith("08999999999", "c1");
    });

    it("should throw 404 when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(service.updateCustomer("c99", { name: "X" })).rejects.toThrow(ApiError);
      await expect(service.updateCustomer("c99", { name: "X" })).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 409 when phone already used by another customer", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existing);
      mockCustomerRepo.isPhoneExists.mockResolvedValue(true);

      await expect(service.updateCustomer("c1", { phone: "08111111111" })).rejects.toThrow(ApiError);
      await expect(service.updateCustomer("c1", { phone: "08111111111" })).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ============================================================
  // deleteCustomer
  // ============================================================
  describe("deleteCustomer", () => {
    const existing = { id: "c1", name: "Budi", phone: "08123456789" };

    it("should delete customer when no vehicles or orders", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existing);
      mockCustomerRepo.hasVehicles.mockResolvedValue(false);
      mockCustomerRepo.hasOrders.mockResolvedValue(false);
      mockCustomerRepo.delete.mockResolvedValue(undefined);

      await expect(service.deleteCustomer("c1")).resolves.toBeUndefined();
      expect(mockCustomerRepo.delete).toHaveBeenCalledWith("c1");
    });

    it("should throw 404 when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(service.deleteCustomer("c99")).rejects.toThrow(ApiError);
      await expect(service.deleteCustomer("c99")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 400 when customer still has vehicles", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existing);
      mockCustomerRepo.hasVehicles.mockResolvedValue(true);

      await expect(service.deleteCustomer("c1")).rejects.toThrow(ApiError);
      await expect(service.deleteCustomer("c1")).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 400 when customer still has orders", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existing);
      mockCustomerRepo.hasVehicles.mockResolvedValue(false);
      mockCustomerRepo.hasOrders.mockResolvedValue(true);

      await expect(service.deleteCustomer("c1")).rejects.toThrow(ApiError);
      await expect(service.deleteCustomer("c1")).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ============================================================
  // checkPhoneAvailability
  // ============================================================
  describe("checkPhoneAvailability", () => {
    it("should return available true when phone not exists", async () => {
      mockCustomerRepo.isPhoneExists.mockResolvedValue(false);

      const result = await service.checkPhoneAvailability("08123456789");
      expect(result).toEqual({
        available: true,
        message: "Nomor telepon '08123456789' tersedia.",
      });
      expect(mockCustomerRepo.isPhoneExists).toHaveBeenCalledWith("08123456789", null);
    });

    it("should return available false when phone exists", async () => {
      mockCustomerRepo.isPhoneExists.mockResolvedValue(true);

      const result = await service.checkPhoneAvailability("08123456789");
      expect(result).toEqual({
        available: false,
        message: "Nomor telepon '08123456789' sudah terdaftar.",
      });
    });

    it("should pass excludeId to repository", async () => {
      mockCustomerRepo.isPhoneExists.mockResolvedValue(false);

      await service.checkPhoneAvailability("08123456789", "c1");
      expect(mockCustomerRepo.isPhoneExists).toHaveBeenCalledWith("08123456789", "c1");
    });
  });
});