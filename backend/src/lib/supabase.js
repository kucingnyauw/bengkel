
import ApiError from "#shared/utils/error.js";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw ApiError.internal({
    message: "Supabase environment variables are not set",
  });
}

 const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


 export default supabase;