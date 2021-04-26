import create, { State } from 'zustand';
export interface WebSocketStoreType extends State {
  connected: boolean;
  setConnected: (bool: boolean) => void;
}
export const useWebSocketStore = create<WebSocketStoreType>((set) => ({
  connected: false,
  setConnected: (bool) =>
    set(() => {
      return { connected: bool };
    }),
}));
