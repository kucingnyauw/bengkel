/**
 * Data Transfer Object untuk response Setting
 * @module dtos/settingDto
 */

/**
 * DTO untuk data setting
 * @class SettingDto
 */
class SettingDto {
    /**
     * @param {Object} data - Data setting dari database
     * @param {string} data.id - ID setting
     * @param {string} data.key - Key setting
     * @param {string} data.value - Value setting
     * @param {string} data.createdAt - Tanggal dibuat
     * @param {string} data.updatedAt - Tanggal diupdate
     */
    constructor(data) {
      this.id = data.id;
      this.key = data.key;
      this.value = data.value;
      this.createdAt = data.createdAt;
      this.updatedAt = data.updatedAt;
    }
  }
  
  export { SettingDto };