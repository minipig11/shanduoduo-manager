import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 在非生产环境下加载本地环境变量
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ 
    path: path.resolve(__dirname, '..', '.env.development')
  });
}

// 根据环境选择合适的配置方式
const supabase = process.env.NODE_ENV === 'production'
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  : createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

export default supabase;
