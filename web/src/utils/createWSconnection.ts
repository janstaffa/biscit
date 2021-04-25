import WS from 'isomorphic-ws';
import ReconnectingWebSocket, { Options } from 'reconnecting-websocket';
import { webSocketURL } from '../constants';

const WS_OPTIONS: Options = {
  connectionTimeout: 4000,
  WebSocket: WS,
  debug: true,
  maxReconnectionDelay: 10000,
  maxRetries: 10,
  minReconnectionDelay: 4000,
  maxEnqueuedMessages: Infinity,
};

export const socket = new ReconnectingWebSocket(webSocketURL, [], WS_OPTIONS);
