// server.js
import express from 'express';
import cors from 'cors';
import ossServer from './router/ossServer.js'; // 引入 OSS 服务路由

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加 OSS 服务路由
app.use('/oss', ossServer);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});