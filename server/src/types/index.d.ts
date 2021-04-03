import { Request as Req, Response as Res } from 'express';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export type ContextType = {
  req: Req;
  res: Res;
};
