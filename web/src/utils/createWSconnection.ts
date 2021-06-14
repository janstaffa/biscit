import WS from 'isomorphic-ws';
import ReconnectingWebSocket, { Options } from 'reconnecting-websocket';
import { SocketMessage } from '..';
import { webSocketURL } from '../constants';
import { useTokenStore } from '../stores/useTokenStore';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { isServer } from './isServer';
import { errorToast } from './toasts';

export const WS_OPTIONS: Options = {
  connectionTimeout: 6000,
  WebSocket: WS,
  debug: false,
  maxReconnectionDelay: 10000,
  maxRetries: 10,
  minReconnectionDelay: 4000,
  maxEnqueuedMessages: Infinity
};
interface Socket {
  ws: ReconnectingWebSocket | undefined;
  connect: () => ReconnectingWebSocket | undefined;
  close: () => boolean;
  restart: () => ReconnectingWebSocket | undefined;
  send: (payload: string) => void;
}

export const socket: Socket = {
  ws: undefined,
  connect: () => {
    if (!isServer() && !socket.ws) {
      socket.ws = new ReconnectingWebSocket(webSocketURL, undefined, WS_OPTIONS);

      socket.ws.onmessage = (e) => {
        const { data: m } = e;
        const parsed = JSON.parse(m);
        const { code } = parsed as SocketMessage;
        if (code === 3001) {
          errorToast(parsed.message);
        }
      };
      socket.ws.onerror = (err) => {
        if (err) {
          socket.ws?.close();
          useWebSocketStore.getState().setConnected(false);
          console.error(err);
        }
      };
      socket.ws.onclose = () => {
        if (socket.ws) {
          socket.ws.onmessage = socket.ws.onerror = socket.ws.onclose = null;
          socket.ws?.close();
        }
        useWebSocketStore.getState().setConnected(false);
      };
      useWebSocketStore.getState().setConnected(true);
    }
    return socket.ws;
  },
  close: () => {
    if (socket.ws) {
      socket.ws.close();
      socket.ws = undefined;
      return true;
    }
    return false;
  },
  restart: () => {
    if (socket.close()) {
      return socket.connect();
    }
  },
  send: (payload) => {
    const ws = socket.connect();
    if (ws) {
      const parsed = JSON.parse(payload);
      const { token } = useTokenStore.getState();
      if (!token) {
        return;
      }
      const newPayload = {
        ...parsed,
        token
      };
      ws.send(JSON.stringify(newPayload));
    }
  }
};
