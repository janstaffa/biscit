import { isServer } from './utils/isServer';

export const __prod__ = process.env.NODE_ENV === 'production';
export const gqlEndpoint = __prod__ ? '' : 'http://localhost:9000/graphql';
export const currentUrl = () => (isServer() ? null : window.location);
export const genericErrorMessage = 'Something went wrong, please try again later.';
export const webSocketURL = 'ws://localhost:9000/socket';
