// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice"; // ایمپورت reducer جدید

export const store = configureStore({
  reducer: {
    ui: uiReducer, // اضافه کردن reducer
    // بعداً reducer های دیگه (مثلاً auth, users) رو هم اینجا میاری
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;