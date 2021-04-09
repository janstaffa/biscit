import { isServer } from './utils/isServer';

export const __prod__ = process.env.NODE_ENV === 'production';
export const gqlEndpoint = __prod__ ? '' : 'http://localhost:9000/graphql';
export const currentUrl = () => (isServer() ? null : window.location);
