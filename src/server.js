     // server.js
     import express from 'express';
     import { fileURLToPath } from 'url';
     import { dirname } from 'path';
     import fs from 'fs';
     import cors from 'cors'; // 新增
     import multer from 'multer';
     import path from 'path';


     const __filename = fileURLToPath(import.meta.url);
     const __dirname = dirname(__filename);

     const app = express();
     app.use(cors()); // 启用 CORS，允许所有域名访问（开发环境适用）
     // 关键配置：必须添加这两行中间件
      app.use(express.json()); // 解析 application/json
      app.use(express.urlencoded({ extended: true })); // 解析 application/x-www-form-urlencoded

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

     // 配置文件存储
     const storage = multer.diskStorage({
       destination: (req, file, cb) => {
         cb(null, IMAGES_DIR); // 保存到图片目录
       },
       filename: (req, file, cb) => {
         cb(null, file.originalname); // 使用原始文件名
       },
     });
     const upload = multer({ storage });

     // 文件上传接口
     app.post('/api/upload', upload.single('image'), (req, res) => {
       res.json({ success: true, filename: req.file.originalname });
     });

     app.delete('/api/images/:filename', (req, res) => {
      console.log('收到删除请求:', req.body); // 打印请求数据
       const filePath = path.join(IMAGES_DIR, req.params.filename);
       fs.unlink(filePath, (err) => {
         if (err) return res.status(500).send('删除失败');
         res.json({ success: true });
       });
     });

     app.post('/api/update-order', (req, res) => {
      try {
        console.log('Received data:', req.body); // 调试日志
    
        // 1. 验证请求体是否为数组
        if (!Array.isArray(req.body)) {
          throw new Error('请求体必须是文件名数组');
        }
    
        // 2. 转换为 { name, title } 格式
        const imageList = req.body
        //const imageList = req.body.map(filename => ({
        //  name: filename,
        //  //title: filename.replace(/\.[^/.]+$/, '') // 移除所有扩展名
        //  title: filename.replace(/\.(jpg|jpeg|png|gif)$/i, '')
        //}));
    
        // 3. 写入文件（格式与 v0list.js 一致）
        const targetDir = 'D:/code_repository_2/liulantupian';
        const filePath = path.join(targetDir, 'v0list.js');
        fs.writeFileSync(
          filePath,
          `module.exports = ${JSON.stringify(imageList, null, 2)};`
        );
    
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
      }
    });

     app.listen(3001, () => console.log('Server running on port 3001'));