// __test__/vehicleService_test.js
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
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create service instance
    service = new VehicleService();
    
    // Get mock instances
    mockVehicleRepo = VehicleRepository.mock.instances[0];
    mockCustomerRepo = CustomerRepository.mock.instances[0];
  });

  describe("registerVehicle", () => {
    const validPayload = {
      plateNumber: "B 1234 CD",
      customerId: "c1",
      brand: "Toyota",
      model: "Avanza",
    };

    /**
     * @test Should register vehicle successfully with all fields
     */
    it("should register vehicle successfully with all fields", async () => {
      // Arrange
      const mockCustomer = { id: "c1", name: "Budi" };
      const mockVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD",
        customerId: "c1",
        brand: "Toyota",
        model: "Avanza",
        createdAt: new Date() 
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue(mockVehicle);

      // Act
      const result = await service.registerVehicle(validPayload);

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockCustomerRepo.findById).toHaveBeenCalledWith("c1");
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD");
      expect(mockVehicleRepo.create).toHaveBeenCalledWith({
        plateNumber: "B 1234 CD",
        customerId: "c1",
        brand: "Toyota",
        model: "Avanza",
      });
    });

    /**
     * @test Should register vehicle with minimal fields (brand and model null)
     */
    it("should register vehicle with minimal fields", async () => {
      // Arrange
      const minimalPayload = {
        plateNumber: "B 5678 EF",
        customerId: "c2",
      };
      
      const mockCustomer = { id: "c2", name: "Ani" };
      const mockVehicle = { 
        id: "v2", 
        plateNumber: "B 5678 EF",
        customerId: "c2",
        brand: null,
        model: null
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue(mockVehicle);

      // Act
      const result = await service.registerVehicle(minimalPayload);

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.create).toHaveBeenCalledWith({
        plateNumber: "B 5678 EF",
        customerId: "c2",
        brand: null,
        model: null,
      });
    });

    /**
     * @test Should normalize plate number (trim and uppercase)
     */
    it("should normalize plate number by trimming and converting to uppercase", async () => {
      // Arrange
      const payload = { 
        ...validPayload, 
        plateNumber: "  b 1234 cd  " 
      };
      
      const mockCustomer = { id: "c1", name: "Budi" };
      const mockVehicle = { id: "v1", plateNumber: "B 1234 CD" };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue(mockVehicle);

      // Act
      await service.registerVehicle(payload);

      // Assert
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD");
      expect(mockVehicleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ plateNumber: "B 1234 CD" })
      );
    });

    /**
     * @test Should trim brand and model if provided
     */
    it("should trim brand and model values", async () => {
      // Arrange
      const payload = {
        ...validPayload,
        brand: "  Toyota  ",
        model: "  Avanza  ",
      };
      
      const mockCustomer = { id: "c1", name: "Budi" };
      const mockVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD",
        brand: "Toyota",
        model: "Avanza"
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue(mockVehicle);

      // Act
      await service.registerVehicle(payload);

      // Assert
      expect(mockVehicleRepo.create).toHaveBeenCalledWith({
        plateNumber: "B 1234 CD",
        customerId: "c1",
        brand: "Toyota",
        model: "Avanza",
      });
    });

    /**
     * @test Should throw ApiError 404 when customer not found
     */
    it("should throw ApiError 404 when customer not found", async () => {
      // Arrange
      mockCustomerRepo.findById.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.registerVehicle(validPayload);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pelanggan dengan ID 'c1' tidak ditemukan");
      }
      
      expect(mockVehicleRepo.isPlateNumberExists).not.toHaveBeenCalled();
      expect(mockVehicleRepo.create).not.toHaveBeenCalled();
    });

    /**
     * @test Should throw ApiError 409 when plate number already exists
     */
    it("should throw ApiError 409 when plate number already exists", async () => {
      // Arrange
      const mockCustomer = { id: "c1", name: "Budi" };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(true);

      // Act & Assert
      try {
        await service.registerVehicle(validPayload);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Plat nomor 'B 1234 CD' sudah terdaftar");
      }
      
      expect(mockVehicleRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("getVehicleById", () => {
    /**
     * @test Should return vehicle when found
     */
    it("should return vehicle when found", async () => {
      // Arrange
      const mockVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD",
        brand: "Toyota",
        model: "Avanza"
      };
      
      mockVehicleRepo.findById.mockResolvedValue(mockVehicle);

      // Act
      const result = await service.getVehicleById("v1");

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.findById).toHaveBeenCalledWith("v1");
    });

    /**
     * @test Should throw ApiError 404 when vehicle not found
     */
    it("should throw ApiError 404 when vehicle not found", async () => {
      // Arrange
      mockVehicleRepo.findById.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.getVehicleById("v99");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Kendaraan dengan ID 'v99' tidak ditemukan");
      }
    });

    /**
     * @test Should handle different vehicle ID formats
     */
    it("should handle different vehicle ID formats", async () => {
      // Arrange
      const mockVehicle = { id: "vehicle-123", plateNumber: "B 1234 CD" };
      mockVehicleRepo.findById.mockResolvedValue(mockVehicle);

      // Act
      const result = await service.getVehicleById("vehicle-123");

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.findById).toHaveBeenCalledWith("vehicle-123");
    });
  });

  describe("getVehicleByPlateNumber", () => {
    /**
     * @test Should return vehicle when found by exact plate number
     */
    it("should return vehicle when found by exact plate number", async () => {
      // Arrange
      const mockVehicle = { id: "v1", plateNumber: "B 1234 CD" };
      mockVehicleRepo.findByPlateNumber.mockResolvedValue(mockVehicle);

      // Act
      const result = await service.getVehicleByPlateNumber("B 1234 CD");

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.findByPlateNumber).toHaveBeenCalledWith("B 1234 CD");
    });

    /**
     * @test Should normalize plate number before search
     */
    it("should normalize plate number before search", async () => {
      // Arrange
      const mockVehicle = { id: "v1", plateNumber: "B 1234 CD" };
      mockVehicleRepo.findByPlateNumber.mockResolvedValue(mockVehicle);

      // Act
      await service.getVehicleByPlateNumber("  b 1234 cd  ");

      // Assert
      expect(mockVehicleRepo.findByPlateNumber).toHaveBeenCalledWith("B 1234 CD");
    });

    /**
     * @test Should throw ApiError 404 when plate number not found
     */
    it("should throw ApiError 404 when plate number not found", async () => {
      // Arrange
      mockVehicleRepo.findByPlateNumber.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.getVehicleByPlateNumber("B 9999 XX");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Kendaraan dengan plat nomor 'B 9999 XX' tidak ditemukan");
      }
    });
  });

  describe("getVehicles", () => {
    /**
     * @test Should return paginated vehicles with default query
     */
    it("should return paginated vehicles with default query", async () => {
      // Arrange
      const mockResult = {
        data: [
          { id: "v1", plateNumber: "B 1234 CD" },
          { id: "v2", plateNumber: "B 5678 EF" }
        ],
        metadata: { 
          total: 2, 
          currentPage: 1, 
          itemsPerPage: 10, 
          totalPages: 1 
        },
      };
      mockVehicleRepo.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await service.getVehicles();

      // Assert
      expect(result).toEqual(mockResult);
      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(mockVehicleRepo.findMany).toHaveBeenCalledWith({});
    });

    /**
     * @test Should pass query parameters to repository
     */
    it("should pass query parameters to repository", async () => {
      // Arrange
      const query = { 
        page: 1, 
        limit: 5, 
        search: "Toyota", 
        customerId: "c1" 
      };
      const mockResult = {
        data: [],
        metadata: { total: 0, currentPage: 1, itemsPerPage: 5, totalPages: 0 },
      };
      mockVehicleRepo.findMany.mockResolvedValue(mockResult);

      // Act
      await service.getVehicles(query);

      // Assert
      expect(mockVehicleRepo.findMany).toHaveBeenCalledWith(query);
    });

    /**
     * @test Should handle empty results
     */
    it("should handle empty results", async () => {
      // Arrange
      const mockResult = {
        data: [],
        metadata: { total: 0, currentPage: 1, itemsPerPage: 10, totalPages: 0 },
      };
      mockVehicleRepo.findMany.mockResolvedValue(mockResult);

      // Act
      const result = await service.getVehicles();

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.metadata.total).toBe(0);
    });
  });

  describe("getVehiclesByCustomer", () => {
    /**
     * @test Should return vehicles for valid customer
     */
    it("should return vehicles for valid customer", async () => {
      // Arrange
      const mockCustomer = { id: "c1", name: "Budi" };
      const mockVehicles = [
        { id: "v1", plateNumber: "B 1234 CD", customerId: "c1" },
        { id: "v2", plateNumber: "B 5678 EF", customerId: "c1" }
      ];

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.findByCustomerId.mockResolvedValue(mockVehicles);

      // Act
      const result = await service.getVehiclesByCustomer("c1");

      // Assert
      expect(result).toEqual(mockVehicles);
      expect(result).toHaveLength(2);
      expect(mockCustomerRepo.findById).toHaveBeenCalledWith("c1");
      expect(mockVehicleRepo.findByCustomerId).toHaveBeenCalledWith("c1");
    });

    /**
     * @test Should return empty array when customer has no vehicles
     */
    it("should return empty array when customer has no vehicles", async () => {
      // Arrange
      const mockCustomer = { id: "c2", name: "Ani" };
      
      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.findByCustomerId.mockResolvedValue([]);

      // Act
      const result = await service.getVehiclesByCustomer("c2");

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    /**
     * @test Should throw ApiError 404 when customer not found
     */
    it("should throw ApiError 404 when customer not found", async () => {
      // Arrange
      mockCustomerRepo.findById.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.getVehiclesByCustomer("c99");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pelanggan dengan ID 'c99' tidak ditemukan");
      }
      
      expect(mockVehicleRepo.findByCustomerId).not.toHaveBeenCalled();
    });
  });

  describe("updateVehicle", () => {
    /**
     * @test Should update vehicle brand and model successfully
     */
    it("should update vehicle brand and model successfully", async () => {
      // Arrange
      const existingVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD", 
        brand: "Toyota", 
        model: "Avanza" 
      };
      const updatedVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD", 
        brand: "Honda", 
        model: "Civic" 
      };
      const payload = { brand: "Honda", model: "Civic" };

      mockVehicleRepo.findById.mockResolvedValue(existingVehicle);
      mockVehicleRepo.update.mockResolvedValue(updatedVehicle);

      // Act
      const result = await service.updateVehicle("v1", payload);

      // Assert
      expect(result).toEqual(updatedVehicle);
      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", payload);
    });

    /**
     * @test Should update plate number when different from existing
     */
    it("should update plate number when different from existing", async () => {
      // Arrange
      const existingVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD" 
      };
      const updatedVehicle = { 
        id: "v1", 
        plateNumber: "B 9999 ZZ" 
      };
      const payload = { plateNumber: "B 9999 ZZ" };

      mockVehicleRepo.findById.mockResolvedValue(existingVehicle);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.update.mockResolvedValue(updatedVehicle);

      // Act
      const result = await service.updateVehicle("v1", payload);

      // Assert
      expect(result).toEqual(updatedVehicle);
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 9999 ZZ", "v1");
      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", { plateNumber: "B 9999 ZZ" });
    });

    /**
     * @test Should normalize and trim updated values
     */
    it("should normalize and trim updated values", async () => {
      // Arrange
      const existingVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD",
        brand: "Toyota",
        model: "Avanza"
      };
      const updatedVehicle = { 
        id: "v1", 
        plateNumber: "B 9999 ZZ",
        brand: "Honda",
        model: "Civic"
      };
      const payload = { 
        plateNumber: "  b 9999 zz  ",
        brand: "  Honda  ",
        model: "  Civic  "
      };

      mockVehicleRepo.findById.mockResolvedValue(existingVehicle);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.update.mockResolvedValue(updatedVehicle);

      // Act
      await service.updateVehicle("v1", payload);

      // Assert
      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", {
        plateNumber: "B 9999 ZZ",
        brand: "Honda",
        model: "Civic"
      });
    });

    /**
     * @test Should throw ApiError 404 when vehicle not found
     */
    it("should throw ApiError 404 when vehicle not found", async () => {
      // Arrange
      mockVehicleRepo.findById.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.updateVehicle("v99", { brand: "Honda" });
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Kendaraan dengan ID 'v99' tidak ditemukan");
      }
      
      expect(mockVehicleRepo.update).not.toHaveBeenCalled();
    });

    /**
     * @test Should throw ApiError 409 when new plate number already used by another vehicle
     */
    it("should throw ApiError 409 when new plate number already used by another vehicle", async () => {
      // Arrange
      const existingVehicle = { id: "v1", plateNumber: "B 1234 CD" };
      const payload = { plateNumber: "B 5678 EF" };

      mockVehicleRepo.findById.mockResolvedValue(existingVehicle);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(true);

      // Act & Assert
      try {
        await service.updateVehicle("v1", payload);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Plat nomor 'B 5678 EF' sudah digunakan oleh kendaraan lain");
      }
      
      expect(mockVehicleRepo.update).not.toHaveBeenCalled();
    });

    /**
     * @test Should allow update when plate number is same as existing (unchanged)
     */
    it("should allow update when plate number is same as existing", async () => {
      // Arrange
      const existingVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD",
        brand: "Toyota"
      };
      const updatedVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD", 
        brand: "Honda" 
      };
      const payload = { plateNumber: "B 1234 CD", brand: "Honda" };

      mockVehicleRepo.findById.mockResolvedValue(existingVehicle);
      mockVehicleRepo.update.mockResolvedValue(updatedVehicle);

      // Act
      const result = await service.updateVehicle("v1", payload);

      // Assert
      expect(result).toEqual(updatedVehicle);
      // Should NOT check if plate exists when it's the same
      expect(mockVehicleRepo.isPlateNumberExists).not.toHaveBeenCalled();
      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", payload);
    });

    /**
     * @test Should update only provided fields
     */
    it("should update only provided fields", async () => {
      // Arrange
      const existingVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD", 
        brand: "Toyota", 
        model: "Avanza" 
      };
      const updatedVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD", 
        brand: "Honda", 
        model: "Avanza" 
      };
      const payload = { brand: "Honda" };

      mockVehicleRepo.findById.mockResolvedValue(existingVehicle);
      mockVehicleRepo.update.mockResolvedValue(updatedVehicle);

      // Act
      const result = await service.updateVehicle("v1", payload);

      // Assert
      expect(result).toEqual(updatedVehicle);
      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", { brand: "Honda" });
    });
  });

  describe("deleteVehicle", () => {
    /**
     * @test Should delete vehicle successfully when no orders exist
     */
    it("should delete vehicle successfully when no orders exist", async () => {
      // Arrange
      const mockVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD", 
        customerId: "c1" 
      };

      mockVehicleRepo.findById.mockResolvedValue(mockVehicle);
      mockVehicleRepo.hasOrders.mockResolvedValue(false);
      mockVehicleRepo.delete.mockResolvedValue(undefined);

      // Act
      await service.deleteVehicle("v1");

      // Assert
      expect(mockVehicleRepo.findById).toHaveBeenCalledWith("v1");
      expect(mockVehicleRepo.hasOrders).toHaveBeenCalledWith("v1");
      expect(mockVehicleRepo.delete).toHaveBeenCalledWith("v1");
    });

    /**
     * @test Should throw ApiError 404 when vehicle not found
     */
    it("should throw ApiError 404 when vehicle not found", async () => {
      // Arrange
      mockVehicleRepo.findById.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.deleteVehicle("v99");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Kendaraan dengan ID 'v99' tidak ditemukan");
      }
      
      expect(mockVehicleRepo.hasOrders).not.toHaveBeenCalled();
      expect(mockVehicleRepo.delete).not.toHaveBeenCalled();
    });

    /**
     * @test Should throw ApiError 409 when vehicle has service orders
     */
    it("should throw ApiError 409 when vehicle has service orders", async () => {
      // Arrange
      const mockVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD",
        customerId: "c1"
      };

      mockVehicleRepo.findById.mockResolvedValue(mockVehicle);
      mockVehicleRepo.hasOrders.mockResolvedValue(true);

      // Act & Assert
      try {
        await service.deleteVehicle("v1");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Kendaraan dengan plat 'B 1234 CD' masih memiliki riwayat servis");
      }
      
      expect(mockVehicleRepo.delete).not.toHaveBeenCalled();
    });

    /**
     * @test Should not call hasOrders if vehicle not found
     */
    it("should not call hasOrders if vehicle not found", async () => {
      // Arrange
      mockVehicleRepo.findById.mockResolvedValue(null);

      // Act & Assert
      try {
        await service.deleteVehicle("nonexistent");
        fail("Should have thrown an error");
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
      
      expect(mockVehicleRepo.hasOrders).not.toHaveBeenCalled();
    });
  });

  describe("checkPlateNumberExists", () => {
    /**
     * @test Should return exists true with message when plate number is registered
     */
    it("should return exists true with message when plate number is registered", async () => {
      // Arrange
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(true);

      // Act
      const result = await service.checkPlateNumberExists("B 1234 CD");

      // Assert
      expect(result).toEqual({
        exists: true,
        message: "Plat nomor 'B 1234 CD' sudah terdaftar.",
      });
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD", null);
    });

    /**
     * @test Should return exists false with message when plate number is available
     */
    it("should return exists false with message when plate number is available", async () => {
      // Arrange
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);

      // Act
      const result = await service.checkPlateNumberExists("B 9999 ZZ");

      // Assert
      expect(result).toEqual({
        exists: false,
        message: "Plat nomor 'B 9999 ZZ' tersedia.",
      });
    });

    /**
     * @test Should normalize plate number before checking
     */
    it("should normalize plate number before checking", async () => {
      // Arrange
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);

      // Act
      await service.checkPlateNumberExists("  b 1234 cd  ");

      // Assert
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD", null);
    });

    /**
     * @test Should pass excludeId when provided
     */
    it("should pass excludeId when provided", async () => {
      // Arrange
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);

      // Act
      await service.checkPlateNumberExists("B 1234 CD", "v1");

      // Assert
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD", "v1");
    });
  });

  describe("searchByPlateNumber", () => {
    /**
     * @test Should return matching vehicles for partial plate number
     */
    it("should return matching vehicles for partial plate number", async () => {
      // Arrange
      const mockVehicles = [
        { id: "v1", plateNumber: "B 1234 CD" },
        { id: "v2", plateNumber: "B 1234 EF" }
      ];
      mockVehicleRepo.searchByPlateNumber.mockResolvedValue(mockVehicles);

      // Act
      const result = await service.searchByPlateNumber("1234");

      // Assert
      expect(result).toEqual(mockVehicles);
      expect(result).toHaveLength(2);
      expect(mockVehicleRepo.searchByPlateNumber).toHaveBeenCalledWith("1234");
    });

    /**
     * @test Should normalize search term
     */
    it("should normalize search term", async () => {
      // Arrange
      mockVehicleRepo.searchByPlateNumber.mockResolvedValue([]);

      // Act
      await service.searchByPlateNumber("  b 1234  ");

      // Assert
      expect(mockVehicleRepo.searchByPlateNumber).toHaveBeenCalledWith("B 1234");
    });

    /**
     * @test Should return empty array when no matches found
     */
    it("should return empty array when no matches found", async () => {
      // Arrange
      mockVehicleRepo.searchByPlateNumber.mockResolvedValue([]);

      // Act
      const result = await service.searchByPlateNumber("XYZ");

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    /**
     * @test Should handle special characters in search term
     */
    it("should handle special characters in search term", async () => {
      // Arrange
      mockVehicleRepo.searchByPlateNumber.mockResolvedValue([]);

      // Act
      await service.searchByPlateNumber("B-1234");

      // Assert
      expect(mockVehicleRepo.searchByPlateNumber).toHaveBeenCalledWith("B-1234");
    });
  });

  describe("Integration scenarios", () => {
    /**
     * @test Should handle complete vehicle lifecycle
     */
    it("should handle complete vehicle lifecycle", async () => {
      // Register
      const mockCustomer = { id: "c1", name: "Budi" };
      const mockVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD",
        customerId: "c1",
        brand: "Toyota",
        model: "Avanza"
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue(mockVehicle);
      
      const registered = await service.registerVehicle({
        plateNumber: "B 1234 CD",
        customerId: "c1",
        brand: "Toyota",
        model: "Avanza"
      });
      expect(registered.plateNumber).toBe("B 1234 CD");

      // Update
      const updatedVehicle = { ...mockVehicle, brand: "Honda" };
      mockVehicleRepo.findById.mockResolvedValue(mockVehicle);
      mockVehicleRepo.update.mockResolvedValue(updatedVehicle);
      
      const updated = await service.updateVehicle("v1", { brand: "Honda" });
      expect(updated.brand).toBe("Honda");

      // Delete
      mockVehicleRepo.findById.mockResolvedValue(updatedVehicle);
      mockVehicleRepo.hasOrders.mockResolvedValue(false);
      mockVehicleRepo.delete.mockResolvedValue(undefined);
      
      await expect(service.deleteVehicle("v1")).resolves.toBeUndefined();
    });
  });
});