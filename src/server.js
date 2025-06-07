     // server.js
     import express from 'express';
     import { fileURLToPath } from 'url';
     import { dirname } from 'path';
     import fs from 'fs';
     import cors from 'cors'; // 新增


     const __filename = fileURLToPath(import.meta.url);
     const __dirname = dirname(__filename);

     const app = express();
     app.use(cors()); // 启用 CORS，允许所有域名访问（开发环境适用）
     
     /*app.use(cors({
      origin: 'http://localhost:5173' // 仅允许该域名跨域
    }));*/

     const IMAGES_DIR = 'D:/code_repository_2/liulantupian/images';

     app.get('/api/images', (req, res) => {
       fs.readdir(IMAGES_DIR, (err, files) => {
         if (err) return res.status(500).send('Error reading directory');
         res.json(files.filter(file => /\.(jpg|jpeg|png)$/i.test(file)));
       });
     });

     app.use('/images', express.static(IMAGES_DIR));
     app.listen(3001, () => console.log('Server running on port 3001'));