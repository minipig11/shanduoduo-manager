import { createClient } from '@supabase/supabase-js'

// 根据环境选择合适的配置方式
const supabase = process.env.NODE_ENV === 'production'
  ? createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    )
  : createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

export default supabase;
