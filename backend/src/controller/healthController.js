/**
 * Controller untuk menangani endpoint health check
 * @class HealthController
 */

import CatchAsync from "#shared/utils/response.js";
import supabase from "#lib/supabase.js";
import redis from "#lib/redis.js";
import prisma from "#app/database.js"; 
import logger from "#app/logger.js";

class HealthController {
  
  /**
   * Memeriksa status kesehatan sistem secara menyeluruh
   * Meliputi pengecekan uptime aplikasi dan konektivitas ke layanan eksternal pendukung
   * @type {import("express").RequestHandler}
   */
  checkHealth = CatchAsync.run(async (req, res) => {
    /**
     * Objek penampung status sistem
     * @type {Object}
     */
    const healthStatus = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: "UNKNOWN",
        redis: "UNKNOWN",
        supabase: "UNKNOWN",
      },
    };

    /**
     * Memeriksa koneksi PostgreSQL melalui Prisma
     */
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthStatus.services.database = "OK";
    } catch (error) {
      healthStatus.services.database = "ERROR";
      logger.error("Health check gagal untuk Database (Prisma)", { error: error.message });
    }

    /**
     * Memeriksa koneksi Redis
     */
    try {
      await redis.ping();
      healthStatus.services.redis = "OK";
    } catch (error) {
      healthStatus.services.redis = "ERROR";
      logger.error("Health check gagal untuk Redis", { error: error.message });
    }

    /**
     * Memeriksa koneksi Supabase 
     * Dengan mencoba mengambil session kosong untuk memastikan endpoint auth aktif
     */
    try {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      healthStatus.services.supabase = "OK";
    } catch (error) {
      healthStatus.services.supabase = "ERROR";
      logger.error("Health check gagal untuk Supabase", { error: error.message });
    }

    /**
     * Menentukan apakah keseluruhan sistem dalam kondisi sehat
     * @type {boolean}
     */
    const isSystemHealthy = Object.values(healthStatus.services).every(
      (status) => status === "OK"
    );

    if (isSystemHealthy) {
      return res.status(200).json({
        success: true,
        message: "Sistem beroperasi dengan normal",
        data: healthStatus,
      });
    } else {
      return res.status(503).json({
        success: false,
        message: "Terjadi gangguan pada satu atau lebih layanan pendukung",
        data: healthStatus,
      });
    }
  });

}

export default new HealthController();