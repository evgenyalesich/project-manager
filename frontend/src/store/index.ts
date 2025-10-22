import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import projectsReducer from "./slices/projectsSlice";
import tasksReducer from "./slices/tasksSlice";
import commentsReducer from "./slices/commentsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    comments: commentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["auth/login/fulfilled", "auth/register/fulfilled"],
        ignoredPaths: ["auth.tokens"],
      },
    }),
  devTools: import.meta.env.MODE !== "production",
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
