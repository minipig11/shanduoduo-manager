export const checkEnvVariables = async () => {
  try {
    const response = await fetch('/api/env-check');
    if (!response.ok) {
      throw new Error('环境变量检查失败');
    }
    const data = await response.json();
    console.table(data);
    return data;
  } catch (error) {
    console.error('环境变量检查错误:', error);
    throw error;
  }
};