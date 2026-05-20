import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

import privateRouter from "#routes/privateRoutes.js";
import publicRouter from "#routes/publicRoutes.js";
import { errorMiddleware } from "#middleware/errorMiddleware.js";
import { isProd } from "#config/env.js";

dotenv.config();

const web = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerPath = path.resolve(__dirname, "../docs/swagger.yml");
const swaggerDocument = YAML.load(swaggerPath);

const version = process.env.API_VERSION || "v1";

const serverUrl =
  process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
swaggerDocument.servers = [
  {
    url: `${serverUrl}/api/${version}`,
    description: "API Server",
  },
];

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!isProd) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.includes("ngrok-free.app") || origin.includes("ngrok.io"))
      return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "ngrok-skip-browser-warning",
    "Origin",
    "Referer",
    "User-Agent",
  ],
  exposedHeaders: ["set-cookie", "Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400,
};

web.use(cors(corsOptions));

web.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

web.use(express.json({ limit: "50mb" }));
web.use(morgan(isProd ? "combined" : "dev"));

web.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Bengkel API",
    swaggerOptions: {
      tryItOutEnabled: true,
      filter: true,
      displayRequestDuration: true,
    },
  })
);

web.get("/", (_, res) => {
  res.redirect("/docs");
});

web.use(publicRouter);
web.use(privateRouter);

web.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route tidak ditemukan",
  });
});

web.use(errorMiddleware);

export default web;
