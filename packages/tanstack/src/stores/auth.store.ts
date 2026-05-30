import type { Session, User } from "@clinic-app/auth";
import { Store } from "@tanstack/store";

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
};

export const authStore = new Store<AuthState>(initialAuthState);

export const authActions = {
  setSession: (session: Session | null) => {
    authStore.setState((state) => ({
      ...state,
      user: session?.user ?? null,
      session: session,
      isAuthenticated: !!session?.user,
      isLoading: false,
    }));
  },

  setLoading: (isLoading: boolean) => {
    authStore.setState((state) => ({ ...state, isLoading }));
  },

  updatePrimaryClinic: (clinic: User["primaryClinic"]) => {
    authStore.setState((state) => ({
      ...state,
      user: state.user ? { ...state.user, primaryClinic: clinic } : null,
    }));
  },

  logout: () => {
    authStore.setState(() => ({
      ...initialAuthState,
      isLoading: false,
    }));
  },

  reset: () => {
    authStore.setState(() => initialAuthState);
  },
};
