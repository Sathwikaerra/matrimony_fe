import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  userId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.token = action.payload.token;
      state.userId = action.payload.userId;
      state.user = action.payload.user;

      // Also sync with localStorage for non-redux parts of the app if needed, 
      // but redux-persist handles the main state persistence.
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("userId", action.payload.userId);
      if (action.payload.user?.name) {
        localStorage.setItem("userName", action.payload.user.name);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userId = null;

      // Clear manual localStorage keys
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (action.payload.name) {
        localStorage.setItem("userName", action.payload.name);
      }
    }
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
