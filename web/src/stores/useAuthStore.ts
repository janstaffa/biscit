import create, { State } from 'zustand';
export interface AuthStoreType extends State {
  authenticated: boolean;
  setAuthenticated: (bool: boolean) => void;
}

export const useAuthStore = create<AuthStoreType>((set) => ({
  authenticated: false,
  setAuthenticated: (bool) =>
    set(() => {
      return { authenticated: bool };
    }),
}));
