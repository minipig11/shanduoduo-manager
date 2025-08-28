import express from 'express';
import cors from 'cors';
import http from 'http';
import ossRouter from './ossServer.js';
import dbRouter from './dbServer.js';
import authRouter from './authServer.js';
import healthRouter from './healthServer.js';
import wsRouter from './wsServer.js';
import WebSocketServer from './websocket/wsServer.mjs';

const app = express();

// Add debug logging
console.log('Server starting.....................');

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/*
Vercel 收到 WebSocket 连接请求 (/ws)
根据 vercel.json 转发到 index.js 中的 WebSocket 服务器处理连接
*/
const server = http.createServer(app);
const wss = new WebSocketServer(server);
app.set('wss', wss);

app.use('/api/oss', ossRouter);
app.use('/api/db', dbRouter);
app.use('/api/auth', authRouter);
app.use('/api/ws', wsRouter);
app.use('/api/health', healthRouter);

export default app;
