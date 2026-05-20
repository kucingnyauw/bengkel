/**
 * Data Transfer Object untuk response User
 * @module dtos/userDto
 */

/**
 * DTO untuk response user (detail, list, by role, after create)
 * @class UserDto
 */
class UserDto {
  /**
   * @param {Object} data - Data user dari database
   * @param {string} data.id - ID user
   * @param {string} data.email - Email user
   * @param {string} data.fullName - Nama lengkap
   * @param {string|null} data.phone - Nomor telepon
   * @param {string} data.role - Role user
   * @param {boolean} data.isActive - Status aktif
   * @param {boolean} data.isAuthenticated - Status autentikasi
   * @param {string} data.createdAt - Waktu pembuatan
   */
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.fullName;
    this.phone = data.phone;
    this.role = data.role;
    this.isActive = data.isActive;
    this.isAuthenticated = data.isAuthenticated;
    this.createdAt = data.createdAt;
  }
}

/**
 * DTO untuk response setelah update user
 * @class UserUpdatedDto
 */
class UserUpdatedDto {
  /**
   * @param {Object} data - Data user dari database
   * @param {string} data.id - ID user
   * @param {string} data.email - Email user
   * @param {string} data.fullName - Nama lengkap
   * @param {string|null} data.phone - Nomor telepon
   * @param {string} data.role - Role user
   * @param {boolean} data.isActive - Status aktif
   * @param {boolean} data.isAuthenticated - Status autentikasi
   * @param {string} data.updatedAt - Waktu terakhir diupdate
   */
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.fullName;
    this.phone = data.phone;
    this.role = data.role;
    this.isActive = data.isActive;
    this.isAuthenticated = data.isAuthenticated;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * DTO untuk response undangan user
 * @class UserInvitationDto
 */
class UserInvitationDto {
  /**
   * @param {Object} data - Data dari Supabase Auth
   * @param {string} data.id - ID user
   * @param {string} data.email - Email user
   * @param {string} data.created_at - Waktu pembuatan
   */
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.invitedAt = data.created_at;
  }
}

/**
 * DTO untuk response validasi email (auth)
 * @class UserEmailValidationDto
 */
class UserEmailValidationDto {
  /**
   * @param {Object} data - Data user dari database
   * @param {string} data.email - Email user
   * @param {string} data.fullName - Nama lengkap
   * @param {string} data.role - Role user
   * @param {boolean} data.isActive - Status aktif
   * @param {boolean} data.isAuthenticated - Status autentikasi
   */
  constructor(data) {
    this.email = data.email;
    this.fullName = data.fullName;
    this.role = data.role;
    this.isActive = data.isActive;
    this.isAuthenticated = data.isAuthenticated;
  }
}

export {
  UserDto,
  UserUpdatedDto,
  UserInvitationDto,
  UserEmailValidationDto,
};