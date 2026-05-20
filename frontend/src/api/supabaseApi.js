import supabase from "@lib/supabase.js";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const signInWithEmailOtp = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${BASE_URL}/auth/callback`,
    },
  });

  if (error) throw error;
  return true;
};

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${BASE_URL}/auth/callback`,
    },
  });

  if (error) throw error;
  return true;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
};

export const verifyCallbackSession = async () => {
  const currentHash = window.location.hash;
  const params = new URLSearchParams(currentHash.replace(/^#/, ""));
  const errorDesc = params.get("error_description");
  const accessToken = params.get("access_token");

  if (errorDesc) {
    throw new Error(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
  }

  if (!accessToken) {
    throw new Error("Token akses tidak ditemukan");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error("Sesi tidak valid atau telah kedaluwarsa.");
  }

  return session;
};
