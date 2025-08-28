import express from 'express';
import cors from 'cors';
import http from 'http';

export function createExpressApp() {
  const app = express();
  
  console.log('[HTTP] Server initializing...');
  
  app.use(cors({
    origin: '*',
    credentials: true
  }));
  
  app.use(express.json());
  
  const server = http.createServer(app);
  
  return { app, server };
}