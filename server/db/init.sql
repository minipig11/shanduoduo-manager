-- 主表：商品信息
CREATE TABLE shanduoduo_items (
  id SERIAL PRIMARY KEY,            -- 自增主键
  title VARCHAR(100) NOT NULL,     -- 商品标题
  image VARCHAR(255) NOT NULL,     -- 图片文件名
  price FLOAT,                     -- 价格
  quantity INTEGER NOT NULL,       -- 数量
  flavor JSONB DEFAULT '[]'::jsonb, -- 口味
  reserved INTEGER NOT NULL,       -- 已预定份数
  unit VARCHAR(10) NOT NULL,       -- 单位
  location VARCHAR(100) NOT NULL,  -- 位置信息
  expire_at BIGINT NOT NULL,       -- 过期时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

alter table shanduoduo_items enable row level security;
create policy "Anyone can view todos" on shanduoduo_items for
    select using (true);
create policy "Anyone can add new todos" on shanduoduo_items for
    insert with check (true);

-- 参与者表
CREATE TABLE shanduoduo_participants (
  id SERIAL PRIMARY KEY,           -- 自增主键
  item_id INTEGER REFERENCES shanduoduo_items(id), -- 关联商品ID
  user_id INTEGER REFERENCES wx_users(id), -- 关联用户ID
  openid VARCHAR(64) NOT NULL,     -- 用户openid
  type VARCHAR(20) NOT NULL,       -- 参与者类型：owner/claimed
  flavor JSONB DEFAULT '[]'::jsonb, -- 口味
  units INTEGER NOT NULL,          -- 参与份数
  claim_time BIGINT,              -- 认领时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 创建索引
CREATE INDEX idx_item_id ON shanduoduo_participants(item_id);
CREATE INDEX idx_openid ON shanduoduo_participants(openid);

alter table shanduoduo_participants enable row level security;
create policy "Anyone can view todos" on shanduoduo_participants for
    select using (true);
create policy "Anyone can add new todos" on shanduoduo_participants for
    insert with check (true);


CREATE TABLE wx_users (
    id SERIAL PRIMARY KEY,
    openid VARCHAR(64) UNIQUE NOT NULL,
    user_name VARCHAR(255) DEFAULT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
create index wx_users_openid_idx on wx_users(openid);

alter table wx_users enable row level security;
create policy "Anyone can view todos" on wx_users for
    select using (true);
create policy "Anyone can add new todos" on wx_users for
    insert with check (true);

  -- 1. 创建一个函数，用于更新 updated_at 字段
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- 2. 创建一个触发器，在 wx_users 表每次更新之前调用上面的函数
  CREATE TRIGGER update_wx_users_updated_at
  BEFORE UPDATE ON wx_users
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
  
  -- 2. 创建一个触发器，在 shanduoduo_items 表每次更新之前调用上面的函数
  CREATE TRIGGER update_shanduoduo_items_updated_at
  BEFORE UPDATE ON shanduoduo_items
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();