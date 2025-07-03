import express from 'express';
import cors from 'cors';
import ossRouter from './ossServer.js';
import dbRouter from './dbServer.js';

const app = express();

// Add debug logging
console.log('Server starting...');
console.log('Environment:', process.env.NODE_ENV);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://shanduoduo-manager.vercel.app'
    : 'http://localhost:5173',
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

// Add health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

export default app;