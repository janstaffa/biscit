declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    DATABASE_URL: string;
    SESSION_SECRET: string;
  }
}