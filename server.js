// server.js
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// import ossServer from './router/ossServer.js';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加 OSS 服务路由
// app.use('/oss', ossServer);

// 处理 / 根请求
app.get('/', (req, res) => {
  const filePath = join(__dirname, 'public', 'pages', 'index.html');
  res.sendFile(filePath);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});