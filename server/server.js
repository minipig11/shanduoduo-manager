// server.js
import { app, server } from './api/index.js';

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`[HTTP] Server running on http://localhost:${PORT}`);
});

export default server;