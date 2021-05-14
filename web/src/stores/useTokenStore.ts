import create, { State } from 'zustand';
export interface TokenStoreType extends State {
  token: string | null;
  setToken: (value: string) => void;
}
export const useTokenStore = create<TokenStoreType>((set) => ({
  token: null,
  setToken: (value) =>
    set(() => {
      return { token: value };
    })
}));
