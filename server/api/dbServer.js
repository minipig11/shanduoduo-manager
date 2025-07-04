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
  const { id, title, image, total_units, available_units, location, expire_at } = itemData;
  
  try {
    // 插入商品信息
    const { data: item, error: itemError } = await supabase
      .from('shanduoduo_items')
      .insert([{
        id,
        title,
        image,
        total_units,
        available_units,
        location,
        expire_at
      }])
      .select()
      .single();

    if (itemError) throw itemError;

    // 插入参与者信息
    const participants = itemData.participants.map(p => ({
      item_id: id,
      type: p.type,
      units: p.units,
      user_name: p.user_name,
      claim_time: p.time || null
    }));

    const { error: participantError } = await supabase
      .from('shanduoduo_participants')
      .insert(participants);

    if (participantError) throw participantError;

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

// API 路由
router.get('/shanduoduo', async (req, res) => {
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
router.post('/items', async (req, res) => {
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


export default router;
