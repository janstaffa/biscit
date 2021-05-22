import { Request as Req, Response as Res } from 'express';
import session from 'express-session';

export default session;
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
  interface Session {
    userId: string;
  }
}

export type ContextType = {
  req: Req;
  res: Res;
};
