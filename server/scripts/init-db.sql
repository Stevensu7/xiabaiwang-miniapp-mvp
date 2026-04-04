-- 瞎掰王数据库初始化脚本
-- 用法：psql -U user -d xiabaiwang -f init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表已在 models/db.js 中自动创建（使用 Sequelize/SQL 直接）
-- 这里添加索引
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
