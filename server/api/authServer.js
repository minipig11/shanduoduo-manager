import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ 
    path: path.resolve(__dirname, '..', '.env.development')
  });
}

const router = express.Router();

// WeChat Mini Program Configuration
const WECHAT_APP_ID = process.env.WECHAT_APP_ID;
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET;

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    console.log('Processing login request with code:', code);

    // Call WeChat auth API
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`WeChat API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data.errcode) {
      console.error('WeChat auth error:', data);
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: data.errmsg
      });
    }

    console.log('Login successful for openid:', data.openid);
    
    res.json({
      success: true,
      openid: data.openid,
      session_key: data.session_key
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});


// 添加微信用户路由
router.post('/wx_users', async (req, res) => {
  try {
    const { openid, userInfo } = req.body;

    if (!openid) {
      return res.status(400).json({ error: 'Missing openid parameter' });
    }

    const result = await upsertWxUser(openid, userInfo);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      isNewUser: result.isNewUser,
      user: result.user
    });

  } catch (error) {
    console.error('处理微信用户请求失败:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;