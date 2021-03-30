import express from 'express';
require('dotenv-safe').config();

const app = express();

app.get('/', (_, res) => {
  res.send('Hey from the server!');
});
app.listen(process.env.PORT, () => {
  console.log(`server running on port ${process.env.PORT}`);
});
