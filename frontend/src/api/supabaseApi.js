import supabase from "@lib/supabase.js";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Kirim OTP ke email untuk login tanpa password.
 */
export const signInWithEmailOtp = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${BASE_URL}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) throw new Error(error.message);
};

/**
 * Login dengan Google OAuth.
 */
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${BASE_URL}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw new Error(error.message);
};

/**
 * Logout dan hapus session.
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

/**
 * Verifikasi session dari callback URL (magic link / OAuth).
 */
export const verifyCallbackSession = async () => {
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const errorDesc = params.get("error_description");
  const accessToken = params.get("access_token");

  if (errorDesc) {
    const message = decodeURIComponent(errorDesc.replace(/\+/g, " "));
    throw new Error(message);
  }

  if (!accessToken) {
    throw new Error("Token akses tidak ditemukan. Silakan coba login kembali.");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error("Gagal mendapatkan sesi. Silakan coba lagi.");
  }

  if (!session) {
    throw new Error("Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.");
  }

  return session;
};