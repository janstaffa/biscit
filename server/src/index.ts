require('dotenv-safe').config();
import { ApolloServer } from 'apollo-server-express';
import { ValidationError } from 'class-validator';
import express from 'express';
import session from 'express-session';
import path from 'path';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { createConnection, getConnection } from 'typeorm';
import { TypeormStore } from 'typeorm-store';
import { COOKIE_NAME, __prod__ } from './constants';
import { Session } from './entities/Session';
import { UserResolver } from './resolvers/user';
import { ContextType } from './types';

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
      secret:
        process.env.SESSION_SECRET || 'dsa41d65sads6ads6a1ds16dsa16d1s6ad',
      resave: false,
      saveUninitialized: false,
      store: new TypeormStore({ repository }),
      cookie: {
        maxAge: 1000 * 3600 * 24 * 7,
        httpOnly: false,
        secure: __prod__,
        sameSite: 'lax',
      },
      rolling: true,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
      validate: true,
    }),
    context: ({ req, res }): ContextType => ({
      req,
      res,
    }),
    playground: true,
    introspection: true,
    formatError: (error) => {
      switch (error.message) {
        case 'Argument Validation Error':
          return {
            message: error.message,
            details: error.extensions?.exception.validationErrors.map(
              (err: ValidationError) => {
                return {
                  field: err.property,
                  value: err.value,
                  constraints: err.constraints
                    ? Object.entries(err.constraints).map((e) => ({
                        [e[0]]: e[1],
                      }))
                    : null,
                };
              }
            ),
          };
        case 'Authentication Error':
          return {
            message: error.message,
            details: error.extensions?.exception.details,
          };
        default:
          return error;
      }
    },
  });

  apolloServer.applyMiddleware({ app, cors: false });

  const port = process.env.PORT || 9000;
  app.listen(port, () => {
    console.log(`🚀 server running on port ${port}`);
  });
})().catch((err) => console.error(err));