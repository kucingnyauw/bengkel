import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCurrentUser, validateUserEmail } from "@api/userApi.js";
import { signInWithEmailOtp, signInWithGoogle, signOut } from "@api/supabaseApi.js";

export const loginWithEmail = createAsyncThunk(
  "auth/loginWithEmail",
  async (email, { rejectWithValue }) => {
    try {
      await validateUserEmail(email);
      await signInWithEmailOtp(email);
      return true;
    } catch (err) {
      return rejectWithValue(err?.message || "Terjadi kesalahan");
    }
  }
);

export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (_, { rejectWithValue }) => {
    try {
      await signInWithGoogle();
      return true;
    } catch (err) {
      return rejectWithValue(err?.message || "Terjadi kesalahan");
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await signOut();
      return true;
    } catch (err) {
      return rejectWithValue(err?.message || "Terjadi kesalahan");
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const user = await getCurrentUser();
      return user;
    } catch (err) {
      return rejectWithValue(err?.message || "Gagal mengambil user");
    }
  }
);