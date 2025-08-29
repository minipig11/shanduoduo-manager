import { WebSocket } from 'ws';
import http from 'http';

class WebSocketServer {
  constructor(server) {
    console.debug('[WSS] Setting up WebSocket server...');
    this.wss = new WebSocket.Server({ 
      server,
      path: '/api/ws',  // Changed path to match API routes
      perMessageDeflate: true,
      clientTracking: true
    });

    this.wss.on('headers', (headers, request) => {
      console.debug('[WSS] Handshake headers:', headers);
    });
  
    this.wss.on('error', (error) => {
      console.error('[WSS] Server error:', error);
    });
    
    console.debug('[WSS] WebSocket server initialized with path: /api/ws');
    this.clients = new Set();
    this.init();
  }

  init() {
    // 添加连接错误处理
    this.wss.on('error', (error) => {
      console.error('[WSS] Server error:', error);
    });

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      const timestamp = new Date().toISOString();
      console.debug(`[WSS] ${timestamp} New connection from ${clientIp}`);
      
      this.clients.add(ws);
      console.debug(`[WSS] Active connections: ${this.clients.size}`);

      // 发送初始状态
      const initialState = { 
        type: 'updateScrollView', 
        showFlag: false 
      };
      console.debug('[WSS] Sending initial state:', initialState);
      this.sendToClient(ws, initialState);

      // 添加错误处理
      ws.on('error', (error) => {
        console.error(`[WSS] Client ${clientIp} error:`, error);
      });

      ws.on('close', (code, reason) => {
        console.debug(`[WSS] Client ${clientIp} disconnected: ${code} - ${reason}`);
        this.clients.delete(ws);
        console.debug(`[WSS] Remaining connections: ${this.clients.size}`);
      });

      ws.on('message', (data) => {
        console.debug(`[WSS] Received message from ${clientIp}:`, data.toString());
      });

      // 添加心跳检测
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });

    // 设置心跳检测间隔
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('Terminating inactive connection');
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  // 向所有连接的客户端广播消息
  broadcast(message) {
    console.debug('[WSS] Broadcasting message:', message);
    console.debug(`[WSS] Active clients: ${this.clients.size}`);
    
    this.clients.forEach(client => {
      console.debug('[WSS] Client state:', client.readyState);
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        console.debug('[WSS] Message sent successfully');
      }
    });
  }

  // 向单个客户端发送消息
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // 更新scroll-view显示状态
  updateScrollViewStatus(showFlag) {
    const message = {
      type: 'updateScrollView',
      showFlag: showFlag
    };
    this.broadcast(message);
  }

  // 关闭服务器
  close() {
    clearInterval(this.heartbeatInterval);
    this.wss.close(() => {
      console.log('WebSocket server closed');
    });
  }
}

export default WebSocketServer;