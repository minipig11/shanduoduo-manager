import { createExpressApp } from './expressServer.js';
import { wsManager } from './websocketServer.js';
import ossRouter from './ossServer.js';
import dbRouter from './dbServer.js';
import authRouter from './authServer.js';
import healthRouter from './healthServer.js';
import wsRouter from './scrollViewFlag.js';

const { app, server } = createExpressApp();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize WebSocket server only when needed
if (process.env.ENABLE_WSS === 'true') {
  const wss = wsManager.initialize(server);
  app.set('wss', wss);
}

app.use('/api/oss', ossRouter);
app.use('/api/db', dbRouter);
app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/scroll-view-flag', wsRouter);

// Export default function for Vercel
export default function handler(req, res) {
  return app(req, res);
}

// Keep the named exports for local development
export { app, server };
