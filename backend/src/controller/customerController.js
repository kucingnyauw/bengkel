import CatchAsync from "#shared/utils/response.js";
import CustomerService from "#service/customerService.js";

import {
  createCustomerSchema,
  upsertCustomerSchema,
  updateCustomerSchema,
  getCustomersQuerySchema,
  customerIdParamSchema,
  customerPhoneParamSchema,
  checkPhoneAvailabilitySchema,
} from "#validation/customerValidation.js";

import {
  CustomerDto,
  CustomerDetailDto,
  CustomerListDto,
} from "#dtos/customerDto.js";

import validate from "#validation/validation.js";

class CustomerController {
  constructor() {
    this.customerService = new CustomerService();
  }

  /**
   * Membuat pelanggan baru
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<void>}
   */
  createCustomer = CatchAsync.run(async (req, res) => {
    const payload = validate(createCustomerSchema, req.body);

    const customer = await this.customerService.createCustomer(payload);

    res.status(201).json({
      success: true,
      message: "Pelanggan berhasil dibuat",
      data: new CustomerDto(customer),
    });
  });

  /**
   * Membuat atau memperbarui pelanggan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<void>}
   */
  upsertCustomer = CatchAsync.run(async (req, res) => {
    const payload = validate(upsertCustomerSchema, req.body);

    const customer = await this.customerService.upsertCustomer(payload);

    const isCreated =
      !customer.updatedAt || customer.createdAt === customer.updatedAt;

    res.status(200).json({
      success: true,
      message: isCreated
        ? "Pelanggan berhasil dibuat"
        : "Pelanggan berhasil diperbarui",
      data: new CustomerDto(customer),
    });
  });

  /**
   * Mendapatkan pelanggan berdasarkan ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<void>}
   */
  getCustomerById = CatchAsync.run(async (req, res) => {
    const { id } = validate(customerIdParamSchema, req.params);

    const customer = await this.customerService.getCustomerById(id);

    res.status(200).json({
      success: true,
      message: "Detail pelanggan berhasil diambil",
      data: new CustomerDetailDto(customer),
    });
  });

  /**
   * Mendapatkan pelanggan berdasarkan nomor telepon
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<void>}
   */
  getCustomerByPhone = CatchAsync.run(async (req, res) => {
    const { phone } = validate(customerPhoneParamSchema, req.params);

    const customer = await this.customerService.getCustomerByPhone(phone);

    res.status(200).json({
      success: true,
      message: "Detail pelanggan berhasil diambil",
      data: new CustomerDetailDto(customer),
    });
  });

  /**
   * Mendapatkan daftar pelanggan dengan filter dan paginasi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<void>}
   */
  getCustomers = CatchAsync.run(async (req, res) => {
    const query = validate(getCustomersQuerySchema, req.query);

    const result = await this.customerService.getCustomers(query);

    res.status(200).json({
      success: true,
      message: "Daftar pelanggan berhasil diambil",
      data: result.data.map((customer) => new CustomerListDto(customer)),
      metadata: result.metadata,
    });
  });

  /**
   * Memperbarui data pelanggan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<void>}
   */
  updateCustomer = CatchAsync.run(async (req, res) => {
    const { id } = validate(customerIdParamSchema, req.params);
    const payload = validate(updateCustomerSchema, req.body);

    const customer = await this.customerService.updateCustomer(id, payload);

    res.status(200).json({
      success: true,
      message: "Data pelanggan berhasil diperbarui",
      data: new CustomerDto(customer),
    });
  });

  /**
   * Menghapus pelanggan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<void>}
   */
  deleteCustomer = CatchAsync.run(async (req, res) => {
    const { id } = validate(customerIdParamSchema, req.params);

    await this.customerService.deleteCustomer(id);

    res.status(200).json({
      success: true,
      message: "Pelanggan berhasil dihapus",
      data: null,
    });
  });

  /**
   * Mengecek ketersediaan nomor telepon
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<void>}
   */
  checkPhoneAvailability = CatchAsync.run(async (req, res) => {
    const query = validate(checkPhoneAvailabilitySchema, req.query);

    const result = await this.customerService.checkPhoneAvailability(
      query.phone,
      query.excludeId
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });
}

export default new CustomerController();
