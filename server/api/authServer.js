import express from 'express';
import fetch from 'node-fetch';
import supabase from './supabase.js';

const router = express.Router();

// WeChat Mini Program Configuration
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  WECHAT_APP_ID: process.env.WECHAT_APP_ID ? 'set' : 'not set',
  WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET ? 'set' : 'not set',
});

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


// Create or update WeChat user
export async function upsertWxUser(openid, userInfo) {
  
  console.debug('openid:', openid);
  console.debug('userInfo:', userInfo);
  try {
    // 查询用户是否存在
    const { data: existingUser, error: queryError } = await supabase
      .from('wx_users')
      .select('*')
      .eq('openid', openid)
      .single();

    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw queryError;
    }

    if (existingUser) {

      // 如果提供 userInfo，更新现有用户信息
      if (userInfo && userInfo.nickName && userInfo.avatarUrl) {
        const { data: updateUser, error: updateError } = await supabase
        .from('wx_users')
        .update({ user_name: userInfo.nickName, avatar_url: userInfo.avatarUrl }) 
        .eq('openid', openid)
        .select();

        if (updateError) throw updateError;
        if (!updateUser || updateUser.length === 0) {
          console.warn('未找到需要更新的 wx_users 记录:', openid);
        }
        return {
          success: true,
          isNewUser: false,
          user: updateUser
        };
      } else {
        // 如果没有提供 userInfo，直接返回现有用户信息
        return {
          success: true,
          isNewUser: false,
          user: existingUser
        };
      }

    } else {
      // 用户不存在，创建新用户
      const { data: newUser, error: insertError } = await supabase
        .from('wx_users')
        .insert([
          {
            openid,
            user_name: null,
            avatar_url: null,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        success: true,
        isNewUser: true,
        user: newUser
      };
    }

  } catch (error) {
    console.error('微信用户操作失败:', error);
    return { success: false, error };
  }
}

export default router;