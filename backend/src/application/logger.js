import { isProd } from "#config/env.js";
import { createLogger, format, transports } from "winston";

const { combine, timestamp, errors, json, printf, colorize } = format;

const devFormat = combine(
  colorize(),
  timestamp(),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = createLogger({
  level: isProd ? "info" : "debug",
  format: isProd ? prodFormat : devFormat,
  transports: [new transports.Console()],
});


export default logger;