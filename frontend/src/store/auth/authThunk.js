/**
 * authThunk.js (kontrak error yang disarankan)
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { getCurrentUser } from "@api/userApi.js";
import { signOut } from "@api/supabaseApi.js";

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
    
      return await getCurrentUser();
    } catch (err) {
      return rejectWithValue({
        code: err?.code || "UNKNOWN_ERROR",
        message: err?.message || "Gagal mengambil user",
      });
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
      return rejectWithValue({
        code: err?.code || "UNKNOWN_ERROR",
        message: err?.message || "Logout gagal",
      });
    }
  }
);