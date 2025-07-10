const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://shanduoduo.sicilyhuang.top/api/db'
  : '/api/db';

// 导出获取数据函数
export async function getShanduoduoData() {
  try {
    console.log('Requesting shanduoduo data...', { API_BASE_URL });
    const response = await fetch(`${API_BASE_URL}/items`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`获取数据失败: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Received data:', data);
    return data;
  } catch (error) {
    console.error('获取 shanduoduo 数据错误:', error);
    throw error;
  }
}

// 确保函数被正确导出
export default {
  getShanduoduoData
};