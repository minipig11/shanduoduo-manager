import express from 'express';
import cors from 'cors';
import http from 'http';
import ossRouter from './ossServer.js';
import dbRouter from './dbServer.js';
import authRouter from './authServer.js';
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

app.use('/api/oss', ossRouter);
app.use('/api/db', dbRouter);
app.use('/api/auth', authRouter);

// Add health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// 创建WebSocket服务器实例
const server = http.createServer(app);
const wss = new WebSocketServer(server);

// 将wss实例添加到app，以便在路由中使用
app.set('wss', wss);

// 添加控制WebSocket的路由
app.post('/api/updateScrollView', (req, res) => {
  const { showFlag } = req.body;
  const wss = req.app.get('wss');
  
  wss.updateScrollViewStatus(showFlag);
  res.json({ success: true });
});

export default app;