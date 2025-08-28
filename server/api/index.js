import { createExpressApp } from './expressServer.js';
import { wsManager } from './websocketServer.js';
import ossRouter from './ossServer.js';
import dbRouter from './dbServer.js';
import authRouter from './authServer.js';
import healthRouter from './healthServer.js';
import wsRouter from './wsServer.js';

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
app.use('/api/ws', wsRouter);

export { app, server };
