import { EStorageKey } from "@/constants/storage";
import sessionApi, { AuthSession } from "@/lib/api/session.api";
import { getAccessTokenFromLS } from "@/lib/auth";
import { LocalStorage } from "@/lib/services/local-storage";
import { create } from "zustand";

interface SessionState {
  isAuthenticated: boolean;
  session: AuthSession | undefined;
  setSession: (data: AuthSession) => void;
  clearSession: () => void;
  checkAuth: () => Promise<boolean>;
  startAuthCheck: () => () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  isAuthenticated: false,
  session: undefined,
  setSession: (data: AuthSession) => {
    set({ session: data, isAuthenticated: true });
  },
  clearSession: () => set({ isAuthenticated: false, session: undefined }),

  checkAuth: async (): Promise<boolean> => {
    const authCode = LocalStorage.get(EStorageKey.AUTH_CODE);
    const accessToken = getAccessTokenFromLS();

    if (accessToken) {
      const data = await sessionApi.auth();
      if (!data) {
        return false;
      }
      set({ session: data, isAuthenticated: true });
      return true;
    } else if (authCode) {
      const data = await sessionApi.getAccessToken();
      if (!data || data.pending) {
        return false;
      }

      LocalStorage.set(EStorageKey.AUTH_TOKEN, data.accessToken);
      return true;
    }
    return false;
  },

  startAuthCheck: () => {
    const interval = setInterval(async () => {
      useSessionStore.getState().checkAuth();
    }, 5000);

    useSessionStore.getState().checkAuth();

    return () => clearInterval(interval);
  },
}));
