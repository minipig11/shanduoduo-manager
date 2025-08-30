import WebSocketServer from './websocket/wsServer.mjs';

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.server = null;
  }

  initialize(server) {
    if (this.wss) {
      console.debug('[WS] WebSocket server already initialized');
      return this.wss;
    }

    console.debug('[WS] Initializing WebSocket server...');
    this.server = server;
    
    // 添加 WebSocket 配置
    this.wss = new WebSocketServer(server);

    console.debug('[WS] WebSocket server initialized successfully');
    return this.wss;
  }

  getWSS() {
    return this.wss;
  }

  close() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      console.debug('[WS] WebSocket server closed');
    }
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();