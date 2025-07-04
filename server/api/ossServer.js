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
console.log('Before dotenv.config():', {
  OSS_REGION: process.env.OSS_REGION,
  OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID ? process.env.OSS_ACCESS_KEY_ID : 'not set',
  OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET ? process.env.OSS_ACCESS_KEY_SECRET : 'not set',
  SUPABASE_URL: process.env.SUPABASE_URL ? process.env.SUPABASE_URL : 'not set',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY : 'not set',
});

// 在非生产环境下加载本地环境变量
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ 
    path: path.resolve(__dirname, '..', '.env.development')
  });
}

console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  OSS_REGION: process.env.OSS_REGION,
  OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID ? process.env.OSS_ACCESS_KEY_ID : 'not set',
  OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET ? process.env.OSS_ACCESS_KEY_SECRET : 'not set',
  SUPABASE_URL: process.env.SUPABASE_URL ? process.env.SUPABASE_URL : 'not set',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY : 'not set',
});

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
const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
});

const OSS_PREFIX = 'images/';
const OSS_LIST_FILE = 'v0list.js';

// Add updateList helper function for OSS
const updateOssList = async (action, filename) => {
  try {
    let currentList = [];
    
    // Read existing list from OSS
    try {
      const result = await client.get(OSS_LIST_FILE);
      console.log("listResult:"+listResult);
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

    console.log(`Successfully ${action === 0 ? 'added' : 'removed'} ${filename} in OSS list`);
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
router.get('/images', async (req, res) => {
  console.log('Received GET request for /images');
  try {
    // Get ordered list from v0list.js
    let orderedList = [];
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

// Upload image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    // 直接使用原始文件名
    const filename = `${OSS_PREFIX}${req.file.originalname}`;
    
    await client.put(filename, req.file.buffer);
    const url = client.signatureUrl(filename);
    
    const shortFilename = req.file.originalname;
    await updateOssList(0, shortFilename);
    
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
router.delete('/images/:filename', async (req, res) => {
  try {
    const filename = `${OSS_PREFIX}${req.params.filename}`;
    await client.delete(filename);
    
    // Update list file
    await updateOssList(1, req.params.filename);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update image order
router.post('/update-order', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      throw new Error('Request body must be an array of filenames');
    }
    
    const fileContent = `module.exports = ${JSON.stringify(req.body, null, 2)};`;
    await client.put(OSS_LIST_FILE, Buffer.from(fileContent));
    
    res.json({ success: true });
  } catch (error) {
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

export default router;