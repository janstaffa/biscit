require('dotenv-safe').config();
import express from 'express';
import path from 'path';
import { createConnection } from 'typeorm';

const app = express();

app.get('/', (_, res) => {
  res.send('Hey from the server!');
});

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

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server running on port ${port}`);
  });
})().catch((err) => console.error(err));
