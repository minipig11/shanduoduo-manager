-- update.sql
-- 记录对 shanduoduo_items 表的更新操作

-- 2024-07-30: 在 shanduoduo_items 表中增加 price 和 quantity 字段
ALTER TABLE shanduoduo_items
ADD COLUMN price FLOAT;

ALTER TABLE shanduoduo_items
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0; -- 假设新添加的 quantity 字段默认为 0，您可以根据实际需求调整 

ALTER TABLE shanduoduo_items
ADD COLUMN unit VARCHAR(10) NOT NULL DEFAULT '个'

-- Add flavor field to shanduoduo_items table
ALTER TABLE shanduoduo_items
ADD COLUMN flavor JSONB DEFAULT '[]'::jsonb;

-- Add an index for JSON querying
CREATE INDEX idx_items_flavor ON shanduoduo_items USING gin(flavor);

-- Migration script if needed
ALTER TABLE shanduoduo_items 
RENAME COLUMN available_units TO reserved;

-- Migration script
ALTER TABLE shanduoduo_items DROP COLUMN total_units;