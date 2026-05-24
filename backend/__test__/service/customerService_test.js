import CustomerService from "#service/customerService.js";

jest.mock("#repository/customerRepository.js");
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("CustomerService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomerService();
  });

  describe("createCustomer", () => {
    it("should create customer successfully", async () => {
      const payload = { name: "Budi", phone: "08123456789" };
      const created = { id: "c1", name: "Budi", phone: "08123456789" };

      const {
        CustomerRepository,
      } = require("#repository/customerRepository.js");
      CustomerRepository.mock.instances[0].create.mockResolvedValue(created);

      const result = await service.createCustomer(payload);
      expect(result).toEqual(created);
    });
  });

  describe("getCustomerById", () => {
    it("should throw 404 when customer not found", async () => {
      const {
        CustomerRepository,
      } = require("#repository/customerRepository.js");
      CustomerRepository.mock.instances[0].findById.mockResolvedValue(null);

      await expect(service.getCustomerById("c99")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should return customer when found", async () => {
      const customer = { id: "c1", name: "Budi" };
      const {
        CustomerRepository,
      } = require("#repository/customerRepository.js");
      CustomerRepository.mock.instances[0].findById.mockResolvedValue(customer);

      const result = await service.getCustomerById("c1");
      expect(result).toEqual(customer);
    });
  });

  describe("updateCustomer", () => {
    it("should throw 409 when phone already used by another customer", async () => {
      const {
        CustomerRepository,
      } = require("#repository/customerRepository.js");
      CustomerRepository.mock.instances[0].findById.mockResolvedValue({
        id: "c1",
        name: "Budi",
        phone: "0812",
      });
      CustomerRepository.mock.instances[0].isPhoneExists.mockResolvedValue(
        true
      );

      await expect(
        service.updateCustomer("c1", { phone: "0813" })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("should update successfully when phone is not taken", async () => {
      const {
        CustomerRepository,
      } = require("#repository/customerRepository.js");
      CustomerRepository.mock.instances[0].findById.mockResolvedValue({
        id: "c1",
        name: "Budi",
        phone: "0812",
      });
      CustomerRepository.mock.instances[0].isPhoneExists.mockResolvedValue(
        false
      );
      CustomerRepository.mock.instances[0].update.mockResolvedValue({
        id: "c1",
        name: "Budi",
        phone: "0813",
      });

      const result = await service.updateCustomer("c1", { phone: "0813" });
      expect(result.phone).toBe("0813");
    });
  });

  describe("deleteCustomer", () => {
    it("should throw 400 when customer has vehicles", async () => {
      const {
        CustomerRepository,
      } = require("#repository/customerRepository.js");
      CustomerRepository.mock.instances[0].findById.mockResolvedValue({
        id: "c1",
        name: "Budi",
      });
      CustomerRepository.mock.instances[0].hasVehicles.mockResolvedValue(true);

      await expect(service.deleteCustomer("c1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should throw 400 when customer has orders", async () => {
      const {
        CustomerRepository,
      } = require("#repository/customerRepository.js");
      CustomerRepository.mock.instances[0].findById.mockResolvedValue({
        id: "c1",
        name: "Budi",
      });
      CustomerRepository.mock.instances[0].hasVehicles.mockResolvedValue(false);
      CustomerRepository.mock.instances[0].hasOrders.mockResolvedValue(true);

      await expect(service.deleteCustomer("c1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should delete successfully when no relations", async () => {
      const {
        CustomerRepository,
      } = require("#repository/customerRepository.js");
      CustomerRepository.mock.instances[0].findById.mockResolvedValue({
        id: "c1",
        name: "Budi",
      });
      CustomerRepository.mock.instances[0].hasVehicles.mockResolvedValue(false);
      CustomerRepository.mock.instances[0].hasOrders.mockResolvedValue(false);
      CustomerRepository.mock.instances[0].delete.mockResolvedValue();

      await expect(service.deleteCustomer("c1")).resolves.toBeUndefined();
    });
  });
});
