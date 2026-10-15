import { createSlice } from "@reduxjs/toolkit";

const savedTheme = typeof localStorage !== "undefined" ? localStorage.getItem("devpulse-theme") : null;

const uiSlice = createSlice({
  name: "ui",
  initialState: { theme: savedTheme === "dark" ? "dark" : "light", toast: null },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("devpulse-theme", state.theme);
    },
    setToast(state, action) { state.toast = action.payload; },
    clearToast(state) { state.toast = null; }
  }
});

export const { toggleTheme, setToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
