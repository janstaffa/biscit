import create, { State } from 'zustand';
export interface WebSocketStoreType extends State {
  connected: boolean;
  ready: boolean;
  setConnected: (bool: boolean) => void;
  setReady: (bool: boolean) => void;
}
export const useWebSocketStore = create<WebSocketStoreType>((set) => ({
  connected: false,
  ready: false,
  setConnected: (bool) =>
    set(() => {
      return { connected: bool };
    }),
  setReady: (bool) =>
    set(() => {
      return { ready: bool };
    })
}));
