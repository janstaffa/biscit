import WS from 'isomorphic-ws';
import ReconnectingWebSocket, { Options } from 'reconnecting-websocket';
import { webSocketURL } from '../constants';
import { useAuth } from '../providers/AuthProvider';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { isServer } from './isServer';

export const WS_OPTIONS: Options = {
  connectionTimeout: 6000,
  WebSocket: WS,
  debug: true,
  maxReconnectionDelay: 10000,
  maxRetries: 10,
  minReconnectionDelay: 4000,
  maxEnqueuedMessages: Infinity
};
interface Socket {
  ws: ReconnectingWebSocket | undefined;
  connect: () => ReconnectingWebSocket | undefined;
}

export const socket: Socket = {
  ws: undefined,
  connect: () => {
    const { isAuthenticated } = useAuth();

    if (!isServer() && !socket.ws && isAuthenticated) {
      socket.ws = new ReconnectingWebSocket(webSocketURL, undefined, WS_OPTIONS);
      socket.ws.addEventListener('error', (err) => {
        if (err) {
          socket.ws?.close();
          useWebSocketStore.getState().setConnected(false);
          console.error(err);
        }
      });
      socket.ws?.addEventListener('close', () => {
        socket.ws?.close();
        useWebSocketStore.getState().setConnected(false);
      });
      useWebSocketStore.getState().setConnected(true);
    }
    return socket.ws;
  }
};
