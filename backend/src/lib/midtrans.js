import ApiError from "#shared/utils/error.js";
import midtransClient from "midtrans-client";

const {
  MIDTRANS_SERVER_KEY,
  MIDTRANS_CLIENT_KEY,
  MIDTRANS_IS_PRODUCTION,
} = process.env;

if (!MIDTRANS_SERVER_KEY || !MIDTRANS_CLIENT_KEY) {
  throw ApiError.internal({
    message: "Midtrans environment variables are not set",
  });
}

const isMidtransProduction = MIDTRANS_IS_PRODUCTION === "true";

const midtrans = new midtransClient.CoreApi({
  isProduction: isMidtransProduction,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

export default midtrans;