import http from "http";
import web from "#app/web.js";
import logger from "#app/logger.js";
import initSocket from "#app/io.js";

const server = http.createServer(web);

initSocket(server);

server.listen(process.env.PORT, () => {
  logger.info("Aplikasi berjalan di port " + process.env.PORT);
});