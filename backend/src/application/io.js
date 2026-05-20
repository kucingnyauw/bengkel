// src/application/socket.js
import { Server } from "socket.io";

let io;

/**
 * Inisialisasi Socket.IO server
 * @param {import("http").Server} server - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
const initSocket = (server) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

/**
 * Mendapatkan instance Socket.IO yang sudah diinisialisasi
 * @returns {Server} Socket.IO server instance
 * @throws {Error} Jika Socket.IO belum diinisialisasi
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export default initSocket;