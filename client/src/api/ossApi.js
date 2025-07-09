const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://shanduoduo.sicilyhuang.top/api/oss'
  : '/api/oss';

export const getImageUrl = (imageName, bucketName) => { 
  return `${API_BASE_URL}/${bucketName}/images/${imageName}`;
};

// 获取 OSS 中的图片列表
export const getOssImages = async (bucketName) => {
  try {
    console.log('Requesting images from:', `${API_BASE_URL}/${bucketName}/images`);
    const response = await fetch(`${API_BASE_URL}/${bucketName}/images`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    let orderedList = await response.json();
    console.log('Received raw image list:', orderedList);
    // 将 orderedList 转换为 { name: string, url: string } 形式的数组
    orderedList = orderedList.map(imageName => ({
      name: imageName,
      url: getImageUrl(imageName, bucketName)
    }));
    console.log('Processed image list:', orderedList);

    return orderedList;
  } catch (error) {
    console.error('获取 OSS 图片列表错误:', error);
    throw error;
  }
};

// 上传图片到 OSS
export const uploadToOss = async (file, bucketName) => {
  try {
    const formData = new FormData();
    // 使用原始文件名
    formData.append('image', file, file.name);

    const response = await fetch(`${API_BASE_URL}/${bucketName}/upload`, {
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
export const deleteFromOss = async (filename, bucketName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${bucketName}/images/${filename}`, {
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
export const updateOssOrder = async (imageList, bucketName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${bucketName}/update-order`, {
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