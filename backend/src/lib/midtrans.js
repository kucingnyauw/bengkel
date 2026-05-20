import ApiError from "#shared/utils/error.js";
import midtransClient from "midtrans-client";
import { isProd } from "#config/env.js";

const { MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, } = process.env;

if (!MIDTRANS_SERVER_KEY || !MIDTRANS_CLIENT_KEY) {
  throw ApiError.internal({
    message: "Midtrans environment variables are not set",
  });
}

 const midtrans = new midtransClient.CoreApi({
  isProduction: isProd,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

export default midtrans;