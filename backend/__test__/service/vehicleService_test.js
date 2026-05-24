import VehicleService from "#service/vehicleService.js";
import VehicleRepository from "#repository/vehicleRepository.js";
import CustomerRepository from "#repository/customerRepository.js";
import ApiError from "#shared/utils/error.js";

// Mock repositories
jest.mock("#repository/vehicleRepository.js");
jest.mock("#repository/customerRepository.js");

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("VehicleService", () => {
  let service;
  let mockVehicleRepo;
  let mockCustomerRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VehicleService();
    mockVehicleRepo = VehicleRepository.mock.instances[0];
    mockCustomerRepo = CustomerRepository.mock.instances[0];
  });

  // ============================================================
  // registerVehicle
  // ============================================================
  describe("registerVehicle", () => {
    const validPayload = {
      plateNumber: "B 1234 CD",
      customerId: "c1",
      brand: "Toyota",
      model: "Avanza",
    };

    it("should register vehicle successfully with all fields", async () => {
      const mockCustomer = { id: "c1", name: "Budi" };
      const mockVehicle = { ...validPayload, id: "v1", createdAt: new Date() };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue(mockVehicle);

      const result = await service.registerVehicle(validPayload);

      expect(result).toEqual(mockVehicle);
      expect(mockCustomerRepo.findById).toHaveBeenCalledWith("c1");
      expect(mockVehicleRepo.create).toHaveBeenCalledWith(validPayload);
    });

    it("should register vehicle with minimal fields", async () => {
      const minimalPayload = { plateNumber: "B 5678 EF", customerId: "c2" };
      const mockCustomer = { id: "c2", name: "Ani" };
      const mockVehicle = { ...minimalPayload, id: "v2", brand: null, model: null };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue(mockVehicle);

      const result = await service.registerVehicle(minimalPayload);

      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.create).toHaveBeenCalledWith({
        plateNumber: "B 5678 EF",
        customerId: "c2",
        brand: null,
        model: null,
      });
    });

    it("should normalize plate number by trimming and converting to uppercase", async () => {
      const payload = { ...validPayload, plateNumber: "  b 1234 cd  " };
      mockCustomerRepo.findById.mockResolvedValue({ id: "c1", name: "Budi" });
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue({ id: "v1", plateNumber: "B 1234 CD" });

      await service.registerVehicle(payload);

      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD");
      expect(mockVehicleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ plateNumber: "B 1234 CD" })
      );
    });

    it("should trim brand and model values", async () => {
      const payload = { ...validPayload, brand: "  Toyota  ", model: "  Avanza  " };
      mockCustomerRepo.findById.mockResolvedValue({ id: "c1", name: "Budi" });
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue({ id: "v1" });

      await service.registerVehicle(payload);

      expect(mockVehicleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ brand: "Toyota", model: "Avanza" })
      );
    });

    it("should throw ApiError 404 when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(service.registerVehicle(validPayload)).rejects.toThrow(ApiError);
      await expect(service.registerVehicle(validPayload)).rejects.toMatchObject({ statusCode: 404 });
      expect(mockVehicleRepo.create).not.toHaveBeenCalled();
    });

    it("should throw ApiError 409 when plate number already exists", async () => {
      mockCustomerRepo.findById.mockResolvedValue({ id: "c1", name: "Budi" });
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(true);

      await expect(service.registerVehicle(validPayload)).rejects.toThrow(ApiError);
      await expect(service.registerVehicle(validPayload)).rejects.toMatchObject({ statusCode: 409 });
      expect(mockVehicleRepo.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // getVehicleById
  // ============================================================
  describe("getVehicleById", () => {
    it("should return vehicle when found", async () => {
      const mockVehicle = { id: "v1", plateNumber: "B 1234 CD" };
      mockVehicleRepo.findById.mockResolvedValue(mockVehicle);

      const result = await service.getVehicleById("v1");
      expect(result).toEqual(mockVehicle);
    });

    it("should throw ApiError 404 when vehicle not found", async () => {
      mockVehicleRepo.findById.mockResolvedValue(null);

      await expect(service.getVehicleById("v99")).rejects.toThrow(ApiError);
      await expect(service.getVehicleById("v99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getVehicleByPlateNumber
  // ============================================================
  describe("getVehicleByPlateNumber", () => {
    it("should return vehicle when found by exact plate number", async () => {
      const mockVehicle = { id: "v1", plateNumber: "B 1234 CD" };
      mockVehicleRepo.findByPlateNumber.mockResolvedValue(mockVehicle);

      const result = await service.getVehicleByPlateNumber("B 1234 CD");
      expect(result).toEqual(mockVehicle);
    });

    it("should normalize plate number before search", async () => {
      mockVehicleRepo.findByPlateNumber.mockResolvedValue({ id: "v1" });
      await service.getVehicleByPlateNumber("  b 1234 cd  ");
      expect(mockVehicleRepo.findByPlateNumber).toHaveBeenCalledWith("B 1234 CD");
    });

    it("should throw ApiError 404 when plate number not found", async () => {
      mockVehicleRepo.findByPlateNumber.mockResolvedValue(null);

      await expect(service.getVehicleByPlateNumber("B 9999 XX")).rejects.toThrow(ApiError);
      await expect(service.getVehicleByPlateNumber("B 9999 XX")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // getVehicles
  // ============================================================
  describe("getVehicles", () => {
    it("should return paginated vehicles with default query", async () => {
      const mockResult = {
        data: [{ id: "v1" }, { id: "v2" }],
        metadata: { total: 2, currentPage: 1, itemsPerPage: 10, totalPages: 1 },
      };
      mockVehicleRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getVehicles();
      expect(result).toEqual(mockResult);
      expect(mockVehicleRepo.findMany).toHaveBeenCalledWith({});
    });

    it("should pass query parameters to repository", async () => {
      const query = { page: 1, limit: 5, search: "Toyota", customerId: "c1" };
      mockVehicleRepo.findMany.mockResolvedValue({ data: [], metadata: {} });

      await service.getVehicles(query);
      expect(mockVehicleRepo.findMany).toHaveBeenCalledWith(query);
    });
  });

  // ============================================================
  // getVehiclesByCustomer
  // ============================================================
  describe("getVehiclesByCustomer", () => {
    it("should return vehicles for valid customer", async () => {
      mockCustomerRepo.findById.mockResolvedValue({ id: "c1" });
      mockVehicleRepo.findByCustomerId.mockResolvedValue([{ id: "v1" }]);

      const result = await service.getVehiclesByCustomer("c1");
      expect(result).toHaveLength(1);
    });

    it("should throw ApiError 404 when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(service.getVehiclesByCustomer("c99")).rejects.toThrow(ApiError);
      await expect(service.getVehiclesByCustomer("c99")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================================
  // updateVehicle
  // ============================================================
  describe("updateVehicle", () => {
    const existingVehicle = { id: "v1", plateNumber: "B 1234 CD", brand: "Toyota" };

    beforeEach(() => {
      mockVehicleRepo.findById.mockResolvedValue(existingVehicle);
    });

    it("should update vehicle brand and model successfully", async () => {
      const payload = { brand: "Honda", model: "Civic" };
      mockVehicleRepo.update.mockResolvedValue({ ...existingVehicle, ...payload });

      const result = await service.updateVehicle("v1", payload);
      expect(result.brand).toBe("Honda");
      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", payload);
    });

    it("should update plate number when different from existing", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.update.mockResolvedValue({ ...existingVehicle, plateNumber: "B 9999 ZZ" });

      const result = await service.updateVehicle("v1", { plateNumber: "B 9999 ZZ" });
      expect(result.plateNumber).toBe("B 9999 ZZ");
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 9999 ZZ", "v1");
    });

    it("should normalize and trim updated values", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.update.mockResolvedValue({});

      await service.updateVehicle("v1", {
        plateNumber: "  b 9999 zz  ",
        brand: "  Honda  ",
        model: "  Civic  "
      });

      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", {
        plateNumber: "B 9999 ZZ",
        brand: "Honda",
        model: "Civic"
      });
    });

    it("should throw ApiError 404 when vehicle not found", async () => {
      mockVehicleRepo.findById.mockResolvedValue(null);

      await expect(service.updateVehicle("v99", { brand: "Honda" })).rejects.toThrow(ApiError);
    });

    it("should throw ApiError 409 when new plate number already used", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(true);

      await expect(service.updateVehicle("v1", { plateNumber: "B 5678 EF" })).rejects.toThrow(ApiError);
    });

    it("should allow update when plate number is same as existing", async () => {
      mockVehicleRepo.update.mockResolvedValue({ ...existingVehicle, brand: "Honda" });

      await service.updateVehicle("v1", { plateNumber: "B 1234 CD", brand: "Honda" });
      
      expect(mockVehicleRepo.isPlateNumberExists).not.toHaveBeenCalled();
      expect(mockVehicleRepo.update).toHaveBeenCalled();
    });
  });

  // ============================================================
  // deleteVehicle
  // ============================================================
  describe("deleteVehicle", () => {
    it("should delete vehicle successfully when no orders exist", async () => {
      mockVehicleRepo.findById.mockResolvedValue({ id: "v1" });
      mockVehicleRepo.hasOrders.mockResolvedValue(false);

      await service.deleteVehicle("v1");
      expect(mockVehicleRepo.delete).toHaveBeenCalledWith("v1");
    });

    it("should throw ApiError 404 when vehicle not found", async () => {
      mockVehicleRepo.findById.mockResolvedValue(null);

      await expect(service.deleteVehicle("v99")).rejects.toThrow(ApiError);
    });

    it("should throw ApiError 409 when vehicle has service orders", async () => {
      mockVehicleRepo.findById.mockResolvedValue({ id: "v1", plateNumber: "B 123" });
      mockVehicleRepo.hasOrders.mockResolvedValue(true);

      await expect(service.deleteVehicle("v1")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // checkPlateNumberExists
  // ============================================================
  describe("checkPlateNumberExists", () => {
    it("should return exists true with message when plate number is registered", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(true);
      const result = await service.checkPlateNumberExists("B 1234 CD");
      expect(result.exists).toBe(true);
    });

    it("should return exists false with message when plate number is available", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      const result = await service.checkPlateNumberExists("B 9999 ZZ");
      expect(result.exists).toBe(false);
    });

    it("should normalize plate number and pass excludeId", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      await service.checkPlateNumberExists("  b 1234 cd  ", "v1");
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD", "v1");
    });
  });

  // ============================================================
  // searchByPlateNumber
  // ============================================================
  describe("searchByPlateNumber", () => {
    it("should return matching vehicles for partial plate number", async () => {
      mockVehicleRepo.searchByPlateNumber.mockResolvedValue([{ id: "v1" }]);
      const result = await service.searchByPlateNumber("  b 12  ");
      expect(result).toHaveLength(1);
      expect(mockVehicleRepo.searchByPlateNumber).toHaveBeenCalledWith("B 12");
    });
  });
});