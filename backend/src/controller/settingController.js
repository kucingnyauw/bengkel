import CatchAsync from "#shared/utils/response.js";
import SettingService from "#service/settingService.js";
import {
  updateSettingSchema,
  bulkUpdateSettingSchema,
} from "#validation/settingValidation.js";
import validate from "#validation/validation.js";
import { SettingDto } from "#dtos/settingDto.js";

/**
 * Controller untuk mengelola endpoint settings
 * @class SettingController
 */
class SettingController {
  constructor() {
    this.settingService = new SettingService();
  }

  /**
   * Mendapatkan semua settings
   */
  getAll = CatchAsync.run(async (req, res) => {
    const settings = await this.settingService.getAll();

    res.status(200).json({
      success: true,
      message: "Daftar settings berhasil diambil",
      data: settings.map((s) => new SettingDto(s)),
    });
  });

  /**
   * Mendapatkan setting berdasarkan key
   */
  getByKey = CatchAsync.run(async (req, res) => {
    const { key } = req.params;

    const value = await this.settingService.get(key);

    res.status(200).json({
      success: true,
      message: "Setting berhasil diambil",
      data: { key, value },
    });
  });

  /**
   * Update satu setting
   */
  update = CatchAsync.run(async (req, res) => {
    const { key } = req.params;
    const { value } = validate(updateSettingSchema, req.body);

    const setting = await this.settingService.set(key, value);

    res.status(200).json({
      success: true,
      message: "Setting berhasil diupdate",
      data: new SettingDto(setting),
    });
  });

  /**
   * Bulk update settings
   */
  bulkUpdate = CatchAsync.run(async (req, res) => {
    const { settings } = validate(bulkUpdateSettingSchema, req.body);

    const results = [];
    for (const item of settings) {
      const setting = await this.settingService.set(item.key, item.value);
      results.push(new SettingDto(setting));
    }

    this.settingService.clearCache();

    res.status(200).json({
      success: true,
      message: `${results.length} setting berhasil diupdate`,
      data: results,
    });
  });
}

export default new SettingController();