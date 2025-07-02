const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 获取 OSS 中的图片列表
export const getOssImages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/oss/images`);
    if (!response.ok) throw new Error('获取图片列表失败');
    return await response.json();
  } catch (error) {
    console.error('获取 OSS 图片列表错误:', error);
    throw error;
  }
};

// 上传图片到 OSS
export const uploadToOss = async (file) => {
  try {
    const formData = new FormData();
    // 使用原始文件名
    formData.append('image', file, file.name);

    const response = await fetch(`${API_BASE_URL}/oss/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '上传失败');
    }
    return await response.json();
  } catch (error) {
    console.error('上传到 OSS 错误:', error);
    throw error;
  }
};

// 从 OSS 删除图片
export const deleteFromOss = async (filename) => {
  try {
    const response = await fetch(`${API_BASE_URL}/oss/images/${filename}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '删除失败');
    }
    return await response.json();
  } catch (error) {
    console.error('从 OSS 删除错误:', error);
    throw error;
  }
};

// 更新 OSS 中的图片顺序
export const updateOssOrder = async (imageList) => {
  try {
    const response = await fetch(`${API_BASE_URL}/oss/update-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageList),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '更新顺序失败');
    }
    return await response.json();
  } catch (error) {
    console.error('更新 OSS 图片顺序错误:', error);
    throw error;
  }
};