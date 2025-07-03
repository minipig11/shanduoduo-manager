import express from 'express';
import ossRouter from './ossServer.js';

const app = express();

app.use(express.json());
app.use('/oss', ossRouter);

export default app;