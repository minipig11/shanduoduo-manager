import { createClient } from '@supabase/supabase-js'

console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'set' : 'not set',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'set' : 'not set',
});

// 根据环境选择合适的配置方式
const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

export default supabase;
