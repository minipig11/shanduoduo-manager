// server.js
import { app, server } from './api/index.js';

const PORT = process.env.PORT || 3000;
const env = process.env.NODE_ENV;

server.listen(PORT, () => {
  console.log(`[HTTP] Server running on http://localhost:${PORT}`);
  console.log(`process.env.NODE_ENV:${env}`);
});

export default server;