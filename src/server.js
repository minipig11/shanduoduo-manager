// server.js
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import ossServer from '../api/ossServer.js'; // 引入 OSS 服务路由

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加 OSS 服务路由
app.use('/oss', ossServer);

const IMAGES_DIR = 'D:/code_repository_2/liulantupian/images';
const VIDEO_DIR = 'D:/code_repository_2/liulantupian/video';

// 添加更新列表的通用辅助函数
const updateList = async (action, filename, listPath) => {
  try {
    const targetDir = path.dirname(listPath);
    
    // 读取现有的列表
    let currentList = [];
    if (fs.existsSync(listPath)) {
      try {
        const content = fs.readFileSync(listPath, 'utf8');
        // 处理 module.exports = [...] 格式
        const jsonStr = content
          .replace('module.exports = ', '')
          .replace(/;$/, '')
          .trim();
        currentList = JSON.parse(jsonStr);
      } catch (parseError) {
        console.warn(`Error parsing ${listPath}, starting with empty list:`, parseError);
        currentList = [];
      }
    }

    // 根据 action 处理列表
    if (action === 0) { // insert
      if (!currentList.includes(filename)) {
        currentList.push(filename);
      }
    } else if (action === 1) { // delete
      currentList = currentList.filter(item => item !== filename);
    }

    // 确保目标目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 写入更新后的列表（保持格式一致）
    const fileContent = `module.exports = ${JSON.stringify(currentList, null, 2)};`;
    fs.writeFileSync(listPath, fileContent);

    console.log(`Successfully ${action === 0 ? 'added' : 'removed'} ${filename} in ${path.basename(listPath)}`);
    console.log('Current list:', currentList);
    return true;
  } catch (error) {
    console.error(`Error updating ${path.basename(listPath)}:`, error);
    return false;
  }
};

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

// 修改图片上传接口
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('图片上传失败');
    }
    
    const listPath = path.join('D:/code_repository_2/liulantupian', 'v0list.js');
    await updateList(0, req.file.originalname, listPath);
    
    res.json({ 
      success: true, 
      filename: req.file.originalname 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 修改图片删除接口
app.delete('/api/images/:filename', async (req, res) => {
  try {
    const filePath = path.join(IMAGES_DIR, req.params.filename);
    await fs.promises.unlink(filePath);
    
    const listPath = path.join('D:/code_repository_2/liulantupian', 'v0list.js');
    await updateList(1, req.params.filename, listPath);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

app.post('/api/update-order', (req, res) => {
  try {
    console.log('Received data:', req.body); // 调试日志

    // 1. 验证请求体是否为数组
    if (!Array.isArray(req.body)) {
      throw new Error('请求体必须是文件名数组');
    }

    // 2. 
    const imageList = req.body;

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

// 获取视频列表接口
app.get('/api/videos', (req, res) => {
  fs.readdir(VIDEO_DIR, (err, files) => {
    if (err) return res.status(500).send('Error reading video directory');
    res.json(files.filter(file => /\.(mp4|avi|mov|wmv)$/i.test(file)));
  });
});

// 提供视频文件的静态访问
app.use('/videos', express.static(VIDEO_DIR));

// 配置视频文件存储
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEO_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const uploadVideo = multer({ storage: videoStorage });

// 修改视频上传接口
app.post('/api/upload-video', uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('视频上传失败');
    }
    
    const listPath = path.join('D:/code_repository_2/liulantupian', 'videolist.js');
    await updateList(0, req.file.originalname, listPath);
    
    res.json({ 
      success: true, 
      filename: req.file.originalname 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 修改视频删除接口
app.delete('/api/videos/:filename', async (req, res) => {
  try {
    const filePath = path.join(VIDEO_DIR, req.params.filename);
    await fs.promises.unlink(filePath);
    
    const listPath = path.join('D:/code_repository_2/liulantupian', 'videolist.js');
    await updateList(1, req.params.filename, listPath);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: '视频删除失败' });
  }
});

// 视频排序更新接口
app.post('/api/update-video-order', (req, res) => {
  try {
    console.log('Received video data:', req.body);

    if (!Array.isArray(req.body)) {
      throw new Error('请求体必须是视频文件名数组');
    }

    const videoList = req.body;
    const targetDir = 'D:/code_repository_2/liulantupian';
    const filePath = path.join(targetDir, 'videolist.js');
    
    fs.writeFileSync(
      filePath,
      `module.exports = ${JSON.stringify(videoList, null, 2)};`
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));