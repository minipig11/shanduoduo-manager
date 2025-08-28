import { WebSocket } from 'ws';
import http from 'http';

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    
    this.init();
  }

  init() {
    this.wss.on('connection', (ws) => {
      console.log('新的WebSocket连接建立');
      this.clients.add(ws);

      // 连接关闭时移除客户端
      ws.on('close', () => {
        console.log('WebSocket连接关闭');
        this.clients.delete(ws);
      });

      // 发送初始状态
      this.sendToClient(ws, {
        type: 'updateScrollView',
        showFlag: true
      });
    });
  }

  // 向所有连接的客户端广播消息
  broadcast(message) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
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
}

export default WebSocketServer;