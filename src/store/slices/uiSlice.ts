// src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  sidebarCollapsed: boolean;   // حالت کوچک/بزرگ در دسکتاپ
  mobileSidebarOpen: boolean;  // حالت باز/بسته بودن سایدبار در موبایل
}

const initialState: UIState = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setMobileSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileSidebarOpen = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
  },
});

export const { toggleSidebarCollapsed, setMobileSidebarOpen, toggleMobileSidebar } = uiSlice.actions;
export default uiSlice.reducer;