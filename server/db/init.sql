-- 主表：商品信息
CREATE TABLE shanduoduo_items (
  id VARCHAR(15) PRIMARY KEY,      -- 商品ID，如 DR202506281001
  title VARCHAR(100) NOT NULL,     -- 商品标题
  image VARCHAR(255) NOT NULL,     -- 图片文件名
  price FLOAT,                     -- 价格
  quantity INTEGER NOT NULL,       -- 数量
  total_units INTEGER NOT NULL,    -- 总份数
  available_units INTEGER NOT NULL, -- 可用份数
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
  item_id VARCHAR(15) REFERENCES shanduoduo_items(id), -- 关联商品ID
  type VARCHAR(20) NOT NULL,       -- 参与者类型：owner/claimed
  units INTEGER NOT NULL,          -- 参与份数
  user_name VARCHAR(50) NOT NULL,  -- 用户名
  claim_time BIGINT,              -- 认领时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 创建索引
CREATE INDEX idx_item_id ON shanduoduo_participants(item_id);

alter table shanduoduo_participants enable row level security;
create policy "Anyone can view todos" on shanduoduo_participants for
    select using (true);
create policy "Anyone can add new todos" on shanduoduo_participants for
    insert with check (true);