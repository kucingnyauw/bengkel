import CatchAsync from "#shared/utils/response.js";
import ProductService from "#service/productService.js";

import {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
  checkSkuAvailabilitySchema,
  productIdParamSchema,
  productSkuParamSchema,
} from "#validation/productValidation.js";

import validate from "#validation/validation.js";

import {
  ProductDetailDto,
  ProductListDto,
  ProductStatusDto,
  ServiceProductDto,
  SparepartProductDto,
  LowStockProductDto,
} from "#dtos/productDto.js";

/**
 * Controller untuk mengelola endpoint produk
 * @class ProductController
 */
class ProductController {
  constructor() {
    this.productService = new ProductService();
  }

  /**
   * [POST] Membuat produk baru
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  createProduct = CatchAsync.run(async (req, res) => {
    const payload = validate(createProductSchema, req.body);
    const file = req.asset;
    const userId = req.user.id;

    const product = await this.productService.createProduct(payload, file, userId);

    res.status(201).json({
      success: true,
      message: "Produk berhasil dibuat",
      data: new ProductDetailDto(product),
    });
  });

  /**
   * [GET] Mendapatkan produk berdasarkan ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getProductById = CatchAsync.run(async (req, res) => {
    const { id } = validate(productIdParamSchema, req.params);

    const product = await this.productService.getProductById(id);

    res.status(200).json({
      success: true,
      message: "Detail produk berhasil diambil",
      data: new ProductDetailDto(product),
    });
  });

  /**
   * [GET] Mendapatkan produk berdasarkan SKU
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getProductBySku = CatchAsync.run(async (req, res) => {
    const { sku } = validate(productSkuParamSchema, req.params);

    const product = await this.productService.getProductBySku(sku);

    res.status(200).json({
      success: true,
      message: "Detail produk berhasil diambil",
      data: new ProductDetailDto(product),
    });
  });

  /**
   * [PUT] Memperbarui produk
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  updateProduct = CatchAsync.run(async (req, res) => {
    const { id } = validate(productIdParamSchema, req.params);
    const payload = validate(updateProductSchema, req.body);
    const file = req.asset;
    const userId = req.user.id;

    const product = await this.productService.updateProduct(id, payload, file, userId);

    res.status(200).json({
      success: true,
      message: "Produk berhasil diperbarui",
      data: new ProductDetailDto(product),
    });
  });

  /**
   * [PATCH] Toggle status aktif produk (ON/OFF)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  updateProductStatus = CatchAsync.run(async (req, res) => {
    const { id } = validate(productIdParamSchema, req.params);

    const product = await this.productService.toggleProductStatus(id);

    res.status(200).json({
      success: true,
      message: `Produk berhasil ${product.isActive ? "diaktifkan" : "dinonaktifkan"}`,
      data: new ProductStatusDto(product),
    });
  });

  /**
   * [GET] Mendapatkan daftar produk dengan filter dan paginasi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getProducts = CatchAsync.run(async (req, res) => {
    const query = validate(getProductsQuerySchema, req.query);

    const result = await this.productService.getProducts(query);

    res.status(200).json({
      success: true,
      message: "Daftar produk berhasil diambil",
      data: result.data.map((product) => new ProductListDto(product)),
      metadata: result.metadata,
    });
  });

  /**
   * [GET] Mendapatkan daftar produk service
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getServices = CatchAsync.run(async (req, res) => {
    const services = await this.productService.getServices();

    res.status(200).json({
      success: true,
      message: "Daftar produk service berhasil diambil",
      data: services.map((service) => new ServiceProductDto(service)),
    });
  });

  /**
   * [GET] Mendapatkan daftar produk sparepart
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getSpareparts = CatchAsync.run(async (req, res) => {
    const spareparts = await this.productService.getSpareparts();

    res.status(200).json({
      success: true,
      message: "Daftar produk sparepart berhasil diambil",
      data: spareparts.map((sparepart) => new SparepartProductDto(sparepart)),
    });
  });

  /**
   * [GET] Mendapatkan produk dengan stok rendah
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getLowStockProducts = CatchAsync.run(async (req, res) => {
    const { threshold } = req.query;

    const products = await this.productService.getLowStockProducts(
      threshold ? parseInt(threshold) : 5
    );

    res.status(200).json({
      success: true,
      message: "Daftar produk dengan stok rendah berhasil diambil",
      data: products.map((product) => new LowStockProductDto(product)),
    });
  });

  /**
   * [GET] Mengecek ketersediaan SKU
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  checkSkuAvailability = CatchAsync.run(async (req, res) => {
    const { sku, excludeId } = validate(checkSkuAvailabilitySchema, req.query);

    const result = await this.productService.checkSkuAvailability(sku, excludeId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });
}

export default new ProductController();