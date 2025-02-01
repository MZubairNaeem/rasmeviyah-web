import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import CustomizerReducer from "./customizer/CustomizerSlice";
import PermissionsReducer from "./apps/user_management/PermissionsSlice";
import RoleReducer from "./apps/user_management/RoleManagmentSlice";
import UserReducer from './apps/user_management/UserSlice';

export const store = configureStore({
  reducer: {
    customizer: CustomizerReducer,
    RoleReducer: RoleReducer,
    PermissionsReducer: PermissionsReducer,
    UserReducer: UserReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

const rootReducer = combineReducers({
  customizer: CustomizerReducer,
  RoleReducer: RoleReducer,
  PermissionsReducer: PermissionsReducer,
  UserReducer: UserReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof rootReducer>;
