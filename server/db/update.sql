-- update.sql
-- 记录对 shanduoduo_items 表的更新操作

-- 2024-07-30: 在 shanduoduo_items 表中增加 price 和 quantity 字段
ALTER TABLE shanduoduo_items
ADD COLUMN price FLOAT;

ALTER TABLE shanduoduo_items
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0; -- 假设新添加的 quantity 字段默认为 0，您可以根据实际需求调整 