import CatchAsync from "#shared/utils/response.js";
import UserService from "#service/userService.js";

import {
  createUserSchema,
  resendMagicLinkSchema,
  updateUserSchema,
  getUsersQuerySchema,
  getEmployeesQuerySchema,
  checkEmailExistsSchema,
  checkPhoneExistsSchema,
  userIdParamSchema,
  userEmailParamSchema,
  userPhoneParamSchema,
  userRoleParamSchema,
  validateEmailSchema,
} from "#validation/userValidation.js";

import validate from "#validation/validation.js";

import {
  UserDto,
  UserUpdatedDto,
  UserEmailValidationDto,
} from "#dtos/userDto.js";

/**
 * Controller untuk mengelola endpoint user
 * @class UserController
 */
class UserController {
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Membuat user baru (hanya CASHIER & MECHANIC)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  createUser = CatchAsync.run(async (req, res) => {
    const payload = validate(createUserSchema, req.body);

    const user = await this.userService.createUser(payload);

    res.status(201).json({
      success: true,
      message: `User berhasil dibuat. Magic Link telah dikirim ke ${payload.email}`,
      data: new UserDto(user),
    });
  });

  /**
   * Generate ulang Magic Link untuk user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  resendMagicLink = CatchAsync.run(async (req, res) => {
    const { id } = validate(resendMagicLinkSchema, req.params);

    const result = await this.userService.resendMagicLink(id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });

  /**
   * Mendapatkan user berdasarkan ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getUserById = CatchAsync.run(async (req, res) => {
    const { id } = validate(userIdParamSchema, req.params);

    const user = await this.userService.getUserById(id);

    res.status(200).json({
      success: true,
      message: "Detail user berhasil diambil",
      data: new UserDto(user),
    });
  });

  /**
   * Mendapatkan user berdasarkan email
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getUserByEmail = CatchAsync.run(async (req, res) => {
    const { email } = validate(userEmailParamSchema, req.params);

    const user = await this.userService.getUserByEmail(email);

    res.status(200).json({
      success: true,
      message: "Detail user berhasil diambil",
      data: new UserDto(user),
    });
  });

  /**
   * Mendapatkan user berdasarkan nomor telepon
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getUserByPhone = CatchAsync.run(async (req, res) => {
    const { phone } = validate(userPhoneParamSchema, req.params);

    const user = await this.userService.getUserByPhone(phone);

    res.status(200).json({
      success: true,
      message: "Detail user berhasil diambil",
      data: new UserDto(user),
    });
  });

  /**
   * Mendapatkan daftar user dengan filter dan paginasi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getUsers = CatchAsync.run(async (req, res) => {
    const query = validate(getUsersQuerySchema, req.query);

    const result = await this.userService.getUsers(query);

    res.status(200).json({
      success: true,
      message: "Daftar user berhasil diambil",
      data: result.data.map((user) => new UserDto(user)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan daftar karyawan (CASHIER & MECHANIC)
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getEmployees = CatchAsync.run(async (req, res) => {
    const query = validate(getEmployeesQuerySchema, req.query);

    const result = await this.userService.getEmployees(query);

    res.status(200).json({
      success: true,
      message: "Daftar karyawan berhasil diambil",
      data: result.data.map((employee) => new UserDto(employee)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan daftar admin
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getAdmins = CatchAsync.run(async (req, res) => {
    const admins = await this.userService.getAdmins();

    res.status(200).json({
      success: true,
      message: "Daftar admin berhasil diambil",
      data: admins.map((admin) => new UserDto(admin)),
    });
  });

  /**
   * Mendapatkan user berdasarkan role
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getUsersByRole = CatchAsync.run(async (req, res) => {
    const { role } = validate(userRoleParamSchema, req.params);

    const users = await this.userService.getUsersByRole(role);

    res.status(200).json({
      success: true,
      message: `Daftar user dengan role ${role} berhasil diambil`,
      data: users.map((user) => new UserDto(user)),
    });
  });

  /**
   * Memperbarui data user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  updateUser = CatchAsync.run(async (req, res) => {
    const { id } = validate(userIdParamSchema, req.params);
    const payload = validate(updateUserSchema, req.body);

    const user = await this.userService.updateUser(id, payload);

    res.status(200).json({
      success: true,
      message: "Data user berhasil diperbarui",
      data: new UserUpdatedDto(user),
    });
  });

  /**
   * Menghapus user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  deleteUser = CatchAsync.run(async (req, res) => {
    const { id } = validate(userIdParamSchema, req.params);

    await this.userService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: "User berhasil dihapus dari sistem",
      data: null,
    });
  });

  /**
   * Validasi email user untuk autentikasi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  validateUserEmail = CatchAsync.run(async (req, res) => {
    const { email } = validate(validateEmailSchema, req.body);

    const user = await this.userService.validateUserEmail(email);

    res.status(200).json({
      success: true,
      message: "Email terdaftar, aktif, dan terautentikasi",
      data: new UserEmailValidationDto(user),
    });
  });

  /**
   * Mengecek ketersediaan email
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  checkEmailExists = CatchAsync.run(async (req, res) => {
    const { email, excludeId } = validate(checkEmailExistsSchema, req.query);

    const result = await this.userService.checkEmailExists(email, excludeId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });

  /**
   * Mengecek ketersediaan nomor telepon
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  checkPhoneExists = CatchAsync.run(async (req, res) => {
    const { phone, excludeId } = validate(checkPhoneExistsSchema, req.query);

    const result = await this.userService.checkPhoneExists(phone, excludeId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });

  /**
   * Mendapatkan data user yang sedang login
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getCurrentUser = CatchAsync.run(async (req, res) => {
    const user = await this.userService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      data: new UserDto(user),
    });
  });

  
}

export default new UserController();