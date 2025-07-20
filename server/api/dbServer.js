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

// Helper function to calculate total claimed units from flavors
function calculateUnitsFromFlavor(flavor) {
if (!Array.isArray(flavor)) return 0;
  return flavor.reduce((sum, f) => sum + (f.claimed || 0), 0);
}

// Calculate total claimed units from participants' units
function calculateTotalClaimed(participants) {
  return participants.reduce((sum, p) => sum + (p.units || 0), 0);
}

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
        reserved: 0, 
        unit: itemData.unit || '个',
        location: itemData.location,
        expire_at: itemData.expire_at,
        flavor: itemData.flavor.map(flavor => ({
          name: flavor.name,
          total: flavor.total 
        }))
      }])
      .select()
      .single();

    if (itemError) throw itemError;

    // Calculate units from flavor claims for each participant
    if (itemData.participants && itemData.participants.length > 0) {
      const participantsWithUnits = itemData.participants.map(p => {
        const units = calculateUnitsFromFlavor(p.flavor);
        return {
          item_id: item.id,
          openid: p.openid,
          type: p.type,
          units: units,
          claim_time: p.claim_time || null,
          flavor: p.flavor
        };
      });

      const { error: participantError } = await supabase
        .from('shanduoduo_participants')
        .insert(participantsWithUnits);

      if (participantError) throw participantError;

      // Calculate and update total reserved
      const totalReserved = calculateTotalClaimed(participantsWithUnits);
      const { error: updateError } = await supabase
        .from('shanduoduo_items')
        .update({ reserved: totalReserved })
        .eq('id', item.id);

      if (updateError) throw updateError;
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

    // 计算实际的 reserved 值
    item.reserved = item.quantity - calculateTotalClaimed(participants);

    // 组合数据，使用计算得到的 reserved 值
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
    
    item.reserved = item.quantity - calculateTotalClaimed(item.shanduoduo_participants || []);
    return { success: true, data: item };
  } catch (error) {
    console.error('获取商品详情失败:', error);
    return { success: false, error };
  }
}

// 获取所有商品列表
export async function getItemData() {
  try {
    // Get all items and their participants
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

    // 组合商品和参与者数据，并计算实际的 reserved 值
    const combinedData = items.map(item => {
      const itemParticipants = participants.filter(p => p.item_id === item.id);
      item.reserved = item.quantity - calculateTotalClaimed(itemParticipants)
      return {
        ...item,
        participants: itemParticipants
      };
    });

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
    const { type, openid, claim_time, flavor } = participantData;
    const units = calculateUnitsFromFlavor(flavor);

    // Get current item and all its participants
    const { data: item, error: itemError } = await supabase
      .from('shanduoduo_items')
      .select(`
        *,
        shanduoduo_participants (*)
      `)
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // Calculate total reserved from all participants
    const currentReserved = calculateTotalClaimed(item.shanduoduo_participants || []);
    const newTotalReserved = currentReserved + units;

    console.log('Reserved calculation:', {
      currentParticipants: item.shanduoduo_participants,
      currentReserved,
      newUnits: units,
      newTotalReserved
    });

    // Check if enough units are available
    if (item.quantity < newTotalReserved) {
      throw new Error('可用份数不足');
    }

    // Add participant with calculated units
    const { data: newParticipant, error: participantError } = await supabase
      .from('shanduoduo_participants')
      .insert([{
        item_id: itemId,
        openid,
        type,
        units,
        flavor: flavor || [],
        claim_time: claim_time || null
      }])
      .select()
      .single();

    if (participantError) throw participantError;

    // Update item's reserved count based on actual participant units
    const { error: updateError } = await supabase
      .from('shanduoduo_items')
      .update({ reserved: newTotalReserved })
      .eq('id', itemId);

    if (updateError) throw updateError;

    // Fetch the final state
    const { data: updatedItem, error: fetchError } = await supabase
      .from('shanduoduo_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    return { 
      success: true,
      data: {
        participant: newParticipant,
        item: updatedItem
      }
    };
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
      .select('reserved')  // Changed from available_units
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // 删除参与者
    const { error: deleteError } = await supabase
      .from('shanduoduo_participants')
      .delete()
      .eq('id', participantId);

    if (deleteError) throw deleteError;

    // 更新商品保留份数
    const { error: updateError } = await supabase
      .from('shanduoduo_items')
      .update({ reserved: item.reserved - participant.units })  // Changed field name and calculation
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
    // Get participant info with flavor
    const { data: participant, error: participantError } = await supabase
      .from('shanduoduo_participants')
      .select('units, flavor')
      .eq('item_id', itemId)
      .eq('openid', openid)
      .single();

    if (participantError) throw participantError;

    // Get current item info
    const { data: item, error: itemError } = await supabase
      .from('shanduoduo_items')
      .select('reserved')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;

    // Delete participant
    const { error: deleteError } = await supabase
      .from('shanduoduo_participants')
      .delete()
      .eq('item_id', itemId)
      .eq('openid', openid);

    if (deleteError) throw deleteError;

    // Update reserved count
    const { error: updateError } = await supabase
      .from('shanduoduo_items')
      .update({ reserved: item.reserved - participant.units })
      .eq('id', itemId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('删除参与者失败:', error);
    return { success: false, error };
  }
}

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
        if (!updateData || updateData.length === 0) {
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
router.post('/items/:id/newParticipant', async (req, res) => {
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
