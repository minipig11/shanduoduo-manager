import OSS from 'ali-oss';
import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add debug logging before dotenv.config()
// console.log('Before dotenv.config():', {
//   OSS_REGION: process.env.OSS_REGION,
//   OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID ? process.env.OSS_ACCESS_KEY_ID : 'not set',
//   OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET ? process.env.OSS_ACCESS_KEY_SECRET : 'not set',
//   VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL : 'not set',
//   VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? process.env.VITE_SUPABASE_ANON_KEY : 'not set',
// });

// 在非生产环境下加载本地环境变量
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ 
    path: path.resolve(__dirname, '..', '.env.development')
  });
}

// console.log('Environment:', {
//   NODE_ENV: process.env.NODE_ENV,
//   OSS_REGION: process.env.OSS_REGION,
//   OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID ? process.env.OSS_ACCESS_KEY_ID : 'not set',
//   OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET ? process.env.OSS_ACCESS_KEY_SECRET : 'not set',
//   VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL : 'not set',
//   VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? process.env.VITE_SUPABASE_ANON_KEY : 'not set',
// });

const BUCKET_LIULANTUPIAN = 'liulantupian';
const BUCKET_SHANDUODUO = 'shanduoduo';

const ossClients = {};

const getOssClient = (bucketName) => {
  if (!bucketName) {
    console.error('Bucket name must be provided to getOssClient.');
    return null;
  }

  if (!process.env.OSS_REGION || !process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_ACCESS_KEY_SECRET) {
    console.error('Missing OSS environment variables for client initialization.');
    return null;
  }

  if (!ossClients[bucketName]) {
    ossClients[bucketName] = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: bucketName,
    });
    console.log(`Initialized OSS client for bucket: ${bucketName}`);
  }
  return ossClients[bucketName];
};

const router = express.Router();

// Enable CORS
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add OPTIONS handler for preflight requests
router.options('*', cors());

// Initialize OSS client
// const client = new OSS({
//   region: process.env.OSS_REGION,
//   accessKeyId: process.env.OSS_ACCESS_KEY_ID,
//   accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
//   bucket: process.env.OSS_BUCKET
// });

const OSS_PREFIX = 'images/';
const OSS_LIST_FILE = 'v0list.js';

// Add updateList helper function for OSS
const updateOssList = async (client, action, filename, bucketName) => {
  try {
    if (bucketName !== BUCKET_LIULANTUPIAN) {
      console.log(`Skipping v0list.js update for bucket: ${bucketName}`);
      return true; // Only update v0list.js for liulantupian bucket
    }

    let currentList = [];
    
    // Read existing list from OSS
    try {
      const result = await client.get(OSS_LIST_FILE);
      console.log("listResult:"+result);
      const content = result.content.toString();
      console.log("content:"+content);
      // Handle module.exports format
      const jsonStr = content
        .replace('module.exports = ', '')
        .replace(/;$/, '')
        .trim();
      console.log("jsonStr:"+jsonStr);
      currentList = JSON.parse(jsonStr);
    } catch (error) {
      if (error.code !== 'NoSuchKey') {
        console.warn('Error reading list file from OSS:', error);
      }
      // Start with empty list if file doesn't exist or there's an error
      currentList = [];
    }

    // Update list based on action
    if (action === 0) { // insert
      if (!currentList.includes(filename)) {
        currentList.push(filename);
      }
    } else if (action === 1) { // delete
      currentList = currentList.filter(item => item !== filename);
    }

    // Write updated list back to OSS
    const fileContent = `module.exports = ${JSON.stringify(currentList, null, 2)};`;
    await client.put(OSS_LIST_FILE, Buffer.from(fileContent));

    console.log(`Successfully ${action === 0 ? 'added' : 'removed'} ${filename} in OSS list for ${bucketName}`);
    console.log('Current list:', currentList);
    return true;
  } catch (error) {
    console.error('Error updating OSS list:', error);
    return false;
  }
};

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Get list of images (now including order from v0list.js)
router.get('/:bucketName/images', async (req, res) => {
  const bucketName = req.params.bucketName;
  console.log(`Received GET request for /${bucketName}/images`);
  try {
    const client = getOssClient(bucketName);
    if (!client) {
      return res.status(500).json({ error: 'OSS client not initialized. Check environment variables and bucket name.' });
    }

    // Get ordered list from v0list.js
    let orderedList = [];
    if (bucketName === BUCKET_LIULANTUPIAN) {
      try {
        const listResult = await client.get(OSS_LIST_FILE);
        console.log("listResult:"+listResult);
        const content = listResult.content.toString();
        console.log("content:"+content);
        const jsonStr = content
          .replace('module.exports = ', '')
          .replace(/;$/, '')
          .trim();
        console.log("jsonStr:"+jsonStr);
        orderedList = JSON.parse(jsonStr);
      } catch (error) {
        if (error.code !== 'NoSuchKey') {
          console.warn('Error reading list file:', error);
        }
      }
    }

    // Get all files from OSS
    const result = await client.list({
      prefix: OSS_PREFIX,
      'max-keys': 1000
    });
    
    const files = result.objects
      .map(obj => ({
        name: obj.name.replace(OSS_PREFIX, ''),
        url: client.signatureUrl(obj.name)
      }))
      .filter(file => file.name !== 'v0list.js');

    // Sort files according to orderedList
    const sortedFiles = files.sort((a, b) => {
      if (bucketName !== BUCKET_LIULANTUPIAN) {
        return 0; // Don't sort if not liulantupian bucket
      }

      const indexA = orderedList.indexOf(a.name);
      const indexB = orderedList.indexOf(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    
    console.log('Sending response:', sortedFiles);
    res.json(sortedFiles);
  } catch (error) {
    console.error('Error in /images endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific image from OSS
router.get('/:bucketName/images/:filename', async (req, res) => {
  const bucketName = req.params.bucketName;
  const filename = `${OSS_PREFIX}${req.params.filename}`;
  try {
    const client = getOssClient(bucketName);
    if (!client) {
      return res.status(500).json({ error: 'OSS client not initialized. Check environment variables and bucket name.' });
    }

    // 获取文件元数据以确定 Content-Type
    let headResult;
    try {
      headResult = await client.head(filename);
    } catch (headError) {
      if (headError.code === 'NoSuchKey') {
        return res.status(404).json({ error: `File not found: ${req.params.filename} in bucket ${bucketName}` });
      }
      console.error('Error getting file head:', headError);
      return res.status(500).json({ error: headError.message });
    }

    const contentType = headResult.res.headers['content-type'];
    res.set('Content-Type', contentType);

    // 获取文件流并直接管道传输到响应
    const result = await client.getStream(filename);
    result.stream.pipe(res);

  } catch (error) {
    console.error('Error in /images/:filename endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload image
router.post('/:bucketName/upload', upload.single('image'), async (req, res) => {
  const bucketName = req.params.bucketName;
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const client = getOssClient(bucketName);
    if (!client) {
      return res.status(500).json({ error: 'OSS client not initialized. Check environment variables and bucket name.' });
    }

    // 直接使用原始文件名
    const filename = `${OSS_PREFIX}${req.file.originalname}`;
    
    await client.put(filename, req.file.buffer);
    const url = client.signatureUrl(filename);
    
    const shortFilename = req.file.originalname;
    await updateOssList(client, 0, shortFilename, bucketName);
    
    res.json({
      success: true,
      filename: shortFilename,
      url: url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete image
router.delete('/:bucketName/images/:filename', async (req, res) => {
  const bucketName = req.params.bucketName;
  try {
    const client = getOssClient(bucketName);
    if (!client) {
      return res.status(500).json({ error: 'OSS client not initialized. Check environment variables and bucket name.' });
    }

    const filename = `${OSS_PREFIX}${req.params.filename}`;
    await client.delete(filename);
    
    // Update list file
    await updateOssList(client, 1, req.params.filename, bucketName);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update image order
router.post('/:bucketName/update-order', async (req, res) => {
  const bucketName = req.params.bucketName;
  try {
    if (!Array.isArray(req.body)) {
      throw new Error('Request body must be an array of filenames');
    }
    
    if (bucketName !== BUCKET_LIULANTUPIAN) {
      console.log(`Skipping update-order for bucket: ${bucketName}. Only ${BUCKET_LIULANTUPIAN} bucket supports order updates.`);
      return res.status(400).json({ error: `Bucket ${bucketName} does not support order updates.` });
    }

    const client = getOssClient(bucketName);
    if (!client) {
      return res.status(500).json({ error: 'OSS client not initialized. Check environment variables and bucket name.' });
    }

    const fileContent = `module.exports = ${JSON.stringify(req.body, null, 2)};`;
    await client.put(OSS_LIST_FILE, Buffer.from(fileContent));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in /update-order endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message
  });
});

// Get v0list.js content for specific bucket
router.get('/:bucketName/v0list.js', async (req, res) => {
  const bucketName = req.params.bucketName;
  try {
    if (bucketName !== BUCKET_LIULANTUPIAN) {
      return res.status(400).json({ error: `Bucket ${bucketName} does not maintain a v0list.js file.` });
    }

    const client = getOssClient(bucketName);
    if (!client) {
      return res.status(500).json({ error: 'OSS client not initialized. Check environment variables and bucket name.' });
    }

    try {
      const result = await client.get(OSS_LIST_FILE);
      const content = result.content.toString();
      // const jsonStr = content
      //   .replace('module.exports = ', '')
      //   .replace(/;$/, '')
      //   .trim();
      res.send(content);
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return res.status(404).json({ error: 'v0list.js not found in this bucket.' });
      }
      console.error('Error reading v0list.js:', error);
      res.status(500).json({ error: error.message });
    }

  } catch (error) {
    console.error('Error in /v0list.js endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;