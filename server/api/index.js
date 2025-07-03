import express from 'express';
import cors from 'cors';
import ossRouter from './ossServer.js';

const app = express();

// Fix the duplicated CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://shanduoduo-manager.vercel.app'
    : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use('/api/oss', ossRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/env-check', (req, res) => {
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    OSS_REGION: process.env.OSS_REGION ? '已设置' : '未设置',
    OSS_BUCKET: process.env.OSS_BUCKET ? '已设置' : '未设置',
    OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID ? '已设置' : '未设置',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '未设置'
  };
  res.json(envStatus);
});

export default app;