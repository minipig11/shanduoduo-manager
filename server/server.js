// server.js
import app from './api/index.js';
// import dotenv from 'dotenv';
// import path from 'path';

// 根据环境加载对应的环境变量文件
// const envFile = process.env.NODE_ENV === 'production' 
//   ? '.env.production' 
//   : '.env.development';

// dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;