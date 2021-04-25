import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { createClient } from 'redis';
import WebSocket from 'ws';
import { Session } from '../entities/Session';
export const sockets = async (server: any) => {
  const wss = new WebSocket.Server({
    server,
    path: '/ws',
  });

  let count = 0;
  wss.on('connection', async (ws, req) => {
    count += 1;
    const rawCookies = req.headers.cookie;
    let userId;
    if (rawCookies) {
      const parsedCookies = cookie.parse(rawCookies);

      const unsignedCookies = cookieParser.signedCookies(
        parsedCookies,
        process.env.SESSION_SECRET as string
      );
      if (unsignedCookies.uid) {
        const session = await Session.findOne({
          where: { id: unsignedCookies.uid },
        });
        if (session) {
          userId = JSON.parse(session.data).userId;
        }
      }
    }
    if (!userId) {
      return wss.close((err) => console.error(err));
    }

    const redisClient = createClient({
      url: process.env.REDIS_URL,
    });
    console.log('USERID: ', userId, count);
    // redisClient.set('test', 'sadsa');
    // redisClient.get('test', (err, data) => console.log(data));

    redisClient.on('error', function (error) {
      console.error(error);
    });
    ws.on('message', (message) => {});
  });
};
