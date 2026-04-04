const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    // 用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        openid VARCHAR(255) UNIQUE NOT NULL,
        nickname VARCHAR(255),
        avatar_url VARCHAR(500),
        premium BOOLEAN DEFAULT FALSE,
        premium_expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 房间表
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(32) PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id),
        max_players SMALLINT DEFAULT 8,
        rounds SMALLINT DEFAULT 3,
        status VARCHAR(32) DEFAULT 'waiting',
        current_round SMALLINT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ
      );
    `);

    // 玩家-房间关联（含积分）
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_players (
        room_id VARCHAR(32) REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        nickname VARCHAR(255),
        score INTEGER DEFAULT 0,
        role VARCHAR(32),
        is_online BOOLEAN DEFAULT TRUE,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (room_id, user_id)
      );
    `);

    // 游戏记录表（每回合）
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_rounds (
        id SERIAL PRIMARY KEY,
        room_id VARCHAR(32) REFERENCES rooms(id),
        round_number SMALLINT,
        question_id INTEGER,
        big_smart_user_id INTEGER REFERENCES users(id),
        honest_user_id INTEGER REFERENCES users(id),
        liar_user_ids INTEGER[],
        honest_answer TEXT,
        big_smart_vote INTEGER REFERENCES users(id),
        honest_caught BOOLEAN,
        liars_guessed_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 题库表
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        term TEXT NOT NULL,
        definition TEXT NOT NULL,
        difficulty SMALLINT DEFAULT 1,
        category VARCHAR(100),
        used_count INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 订单表（会员/道具）
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(32),
        amount DECIMAL(10,2),
        status VARCHAR(32) DEFAULT 'pending',
        wx_trade_no VARCHAR(64),
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
