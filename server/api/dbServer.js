import supabase from './supabase.js';
import express from 'express';

const router = express.Router();

// Add error handling for Supabase connection
router.use((req, res, next) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection not initialized' });
  }
  next();
});

// 创建新商品
export async function createItem(itemData) {
  try {
    const { data: item, error: itemError } = await supabase
      .from('shanduoduo_items')
      .insert([{
        title: itemData.title,
        image: itemData.image,
        price: itemData.price || null,
        quantity: itemData.quantity,
        total_units: itemData.total_units,
        available_units: itemData.total_units, // 初始可用份数等于总份数
        location: itemData.location,
        expire_at: itemData.expire_at
      }])
      .select()
      .single();

    if (itemError) throw itemError;

    // 如果有初始参与者（owner），创建参与者记录
    if (itemData.participants && itemData.participants.length > 0) {
      const { error: participantError } = await supabase
        .from('shanduoduo_participants')
        .insert(
          itemData.participants.map(p => ({
            item_id: item.id,  // 使用自动生成的 id
            openid: p.openid,
            type: p.type,
            units: p.units,
            claim_time: p.claim_time || null
          }))
        );

      if (participantError) throw participantError;
    }

    return { success: true, data: item };
  } catch (error) {
    console.error('创建商品失败:', error);
    return { success: false, error };
  }
}

// 获取商品详情（包括参与者信息）
export async function getItemDetails(itemId) {
  try {
    // 获取商品信息
    const { data: item, error: itemError } = await supabase
      .from('shanduoduo_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // 获取参与者信息
    const { data: participants, error: participantError } = await supabase
      .from('shanduoduo_participants')
      .select('*')
      .eq('item_id', itemId);

    if (participantError) throw participantError;

    // 组合数据
    return {
      success: true,
      data: {
        ...item,
        participants: participants
      }
    };
  } catch (error) {
    console.error('获取商品详情失败:', error);
    return { success: false, error };
  }
}

// 获取商品详情（包括参与者信息）
export async function getItemById(id) {
  try {
    const { data: item, error: itemError } = await supabase
      .from('shanduoduo_items')
      .select('*, shanduoduo_participants(*)')
      .eq('id', parseInt(id))  // 确保 id 是数字类型
      .single();

    if (itemError) throw itemError;
    return { success: true, data: item };
  } catch (error) {
    console.error('获取商品详情失败:', error);
    return { success: false, error };
  }
}

// 获取所有商品列表
export async function getItemData() {
  try {
    // 获取所有商品信息
    const { data: items, error: itemsError } = await supabase
      .from('shanduoduo_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (itemsError) throw itemsError;

    // 获取所有参与者信息
    const { data: participants, error: participantsError } = await supabase
      .from('shanduoduo_participants')
      .select('*');

    if (participantsError) throw participantsError;

    // 组合商品和参与者数据
    const combinedData = items.map(item => ({
      ...item,
      participants: participants.filter(p => p.item_id === item.id)
    }));

    return {
      success: true,
      data: combinedData
    };
  } catch (error) {
    console.error('获取商品列表失败:', error);
    return { success: false, error };
  }
}

// 添加参与者
export async function addParticipant(itemId, participantData) {
  try {
    const { type, units, openid, claim_time } = participantData;

    // First get user_id from wx_users table
    const { data: userData, error: userError } = await supabase
      .from('wx_users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (userError) throw userError;

    // Add participant with user_id and openid
    const { error: participantError } = await supabase
      .from('shanduoduo_participants')
      .insert([{
        item_id: itemId,
        user_id: userData.id,
        openid: openid,
        type,
        units,
        claim_time: claim_time || null
      }]);

    if (participantError) throw participantError;

    return { success: true };
  } catch (error) {
    console.error('添加参与者失败:', error);
    return { success: false, error };
  }
}

// 删除参与者
export async function removeParticipant(itemId, participantId) {
  try {
    // 获取参与者信息
    const { data: participant, error: participantError } = await supabase
      .from('shanduoduo_participants')
      .select('units')
      .eq('id', participantId)
      .single();

    if (participantError) throw participantError;

    // 获取当前商品信息
    const { data: item, error: itemError } = await supabase
      .from('shanduoduo_items')
      .select('available_units')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // 删除参与者
    const { error: deleteError } = await supabase
      .from('shanduoduo_participants')
      .delete()
      .eq('id', participantId);

    if (deleteError) throw deleteError;

    // 更新商品可用份数
    const { error: updateError } = await supabase
      .from('shanduoduo_items')
      .update({ available_units: item.available_units + participant.units })
      .eq('id', itemId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('删除参与者失败:', error);
    return { success: false, error };
  }
}

// 通过 openid 删除参与者
export async function removeParticipantByOpenid(itemId, openid) {
  try {
    // 获取参与者信息
    const { data: participant, error: participantError } = await supabase
      .from('shanduoduo_participants')
      .select('units')
      .eq('item_id', itemId)  // 现在使用数字类型的 item_id
      .eq('openid', openid)
      .single();

    if (participantError) throw participantError;

    // 获取当前商品信息
    const { data: item, error: itemError } = await supabase
      .from('shanduoduo_items')
      .select('available_units')
      .eq('id', itemId)  // 使用数字类型的 id
      .single();

    if (itemError) throw itemError;

    // 删除参与者
    const { error: deleteError } = await supabase
      .from('shanduoduo_participants')
      .delete()
      .eq('item_id', itemId)
      .eq('openid', openid);

    if (deleteError) throw deleteError;

    // 更新商品可用份数
    const { error: updateError } = await supabase
      .from('shanduoduo_items')
      .update({ available_units: item.available_units + participant.units })
      .eq('id', itemId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('删除参与者失败:', error);
    return { success: false, error };
  }
}

// Create or update WeChat user
export async function upsertWxUser(openid) {
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
      // 用户已存在，返回现有用户信息
      return {
        success: true,
        isNewUser: false,
        user: existingUser
      };
    }

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

  } catch (error) {
    console.error('微信用户操作失败:', error);
    return { success: false, error };
  }
}

// API 路由
router.get('/items', async (req, res) => {
  try {
    const result = await getItemData();
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error) {
    console.error('处理请求时发生错误：', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建商品路由
router.post('/newItem', async (req, res) => {
  try {
    const result = await createItem(req.body);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取商品详情路由
router.get('/items/:id', async (req, res) => {
  try {
    const result = await getItemDetails(req.params.id);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 添加参与者路由
router.post('/items/:id/participants', async (req, res) => {
  try {
    const result = await addParticipant(req.params.id, req.body);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除参与者路由
router.delete('/items/:itemId/participants/:participantId', async (req, res) => {
  try {
    const result = await removeParticipant(req.params.itemId, req.params.participantId);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 通过 openid 删除参与者路由
router.delete('/items/:itemId/participants/openid/:openid', async (req, res) => {
  try {
    const result = await removeParticipantByOpenid(req.params.itemId, req.params.openid);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 添加微信用户路由
router.post('/wx_users', async (req, res) => {
  try {
    const { openid } = req.body;

    if (!openid) {
      return res.status(400).json({ error: 'Missing openid parameter' });
    }

    const result = await upsertWxUser(openid);
    
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
