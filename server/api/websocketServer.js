import http from 'http';
import WebSocketServer from './websocket/wsServer.mjs';
import express from 'express';
import cors from 'cors';

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.server = null;
  }

  initialize(server) {
    if (this.wss) {
      console.debug('[WSS] WebSocket server already initialized');
      return this.wss;
    }

    console.debug('[WSS] Initializing WebSocket server...');
    this.server = server;
    
    // 添加 WebSocket 配置
    this.wss = new WebSocketServer(server, {
      path: '/ws',
      handleProtocols: (protocols, req) => {
        console.debug('[WSS] Client protocols:', protocols);
        return protocols[0];
      },
      verifyClient: (info, done) => {
        console.debug('[WSS] Verifying client connection from:', info.req.headers.origin);
        // 允许所有连接
        done(true);
      }
    });

    console.debug('[WSS] WebSocket server initialized successfully');
    return this.wss;
  }

  getWSS() {
    return this.wss;
  }

  close() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      console.debug('[WSS] WebSocket server closed');
    }
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();