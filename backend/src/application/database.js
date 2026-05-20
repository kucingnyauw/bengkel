import { PrismaClient } from "@prisma/client";
import { isProd } from "#config/env.js";

import logger from "#app/logger.js";

const globalForPrisma = globalThis;

 const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: isProd
      ? ["error"]
      : [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ],
  });

if (!isProd) {
  globalForPrisma.prisma = prisma;

  prisma.$on("query", (e) => {
    logger.debug(e.query);
  });

  prisma.$on("warn", (e) => {
    logger.warn(e.message);
  });

  prisma.$on("error", (e) => {
    logger.error(e.message);
  });
}


export default prisma;