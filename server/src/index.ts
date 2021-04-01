require('dotenv-safe').config();
import express from 'express';
import session from 'express-session';
import path from 'path';
import { createConnection, getConnection } from 'typeorm';
import { TypeormStore } from 'typeorm-store';
import { COOKIE_NAME, __prod__ } from './constants';
import { Session } from './entities/Session';
import { User } from './entities/User';

(async () => {
  const conn = await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [path.join(__dirname, './entities/*')],
    synchronize: true,
  });
  await conn.runMigrations();

  const app = express();

  app.get('/', (_, res) => {
    res.send('Hey from the server!');
  });
  const repository = getConnection().getRepository(Session);
  app.use(
    session({
      name: COOKIE_NAME,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new TypeormStore({ repository }),
      cookie: {
        maxAge: 1000 * 3600 * 24,
        httpOnly: true,
        secure: __prod__,
        sameSite: 'lax',
      },
      rolling: true,
    })
  );
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server running on port ${port}`);
  });

  await User.delete({});
  console.log(
    '1111111111111111111111111111111',
    await User.create({
      username: 'John',
      email: 'john@babel.com',
      password: 'hhhhh',
    }).save()
  );
  console.log('2222222222222', await User.find({}));
})().catch((err) => console.error(err));
