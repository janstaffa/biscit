import { Request as Req, Response as Res } from 'express';
declare module 'express-session' {
  interface Session {
    userId: string;
  }
}

export type ContextType = {
  req: Req;
  res: Res;
};
