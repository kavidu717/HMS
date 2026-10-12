
import { create } from "zustand";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  privileges: string[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  setUser: (user: AuthUser) => void;
  setCheckingAuth: (value: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      isCheckingAuth: false,
    }),

  setCheckingAuth: (value) =>
    set({ isCheckingAuth: value }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isCheckingAuth: false,
    }),
}));
