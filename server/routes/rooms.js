const express = require('express');
const { pool, redisClient } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 创建房间
router.post('/', authenticateToken, async (req, res) => {
  const { maxPlayers, rounds } = req.body;
  const ownerId = req.user.userId;
  const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const room = await client.query(
      `INSERT INTO rooms (id, owner_id, max_players, rounds) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [roomId, ownerId, maxPlayers || 8, rounds || 3]
    );
    // 房主自动加入
    await client.query(
      `INSERT INTO room_players (room_id, user_id, nickname) 
       VALUES ($1, $2, $3)`,
      [roomId, ownerId, req.user.nickname]
    );
    await client.query('COMMIT');
    // 缓存房间基本信息到 Redis，方便快速查询
    await redisClient.setEx(`room:${roomId}`, 3600, JSON.stringify({
      status: 'waiting',
      players: 1,
      maxPlayers: maxPlayers || 8
    }));
    res.json({ room: room.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'create_room_failed' });
  } finally {
    client.release();
  }
});

// 加入房间
router.post('/:roomId/join', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const { nickname } = req.body;
  const userId = req.user.userId;
  const client = await pool.connect();
  try {
    const roomRes = await client.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ error: 'room_not_found' });
    }
    const room = roomRes.rows[0];
    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'game_already_started' });
    }
    // 检查人数
    const playersRes = await client.query(
      'SELECT COUNT(*) FROM room_players WHERE room_id = $1',
      [roomId]
    );
    if (playersRes.rows[0].count >= room.max_players) {
      return res.status(400).json({ error: 'room_full' });
    }
    // 加入
    await client.query(
      `INSERT INTO room_players (room_id, user_id, nickname) 
       VALUES ($1, $2, $3) ON CONFLICT (room_id, user_id) DO NOTHING`,
      [roomId, userId, nickname]
    );
    // 更新 Redis 缓存
    await redisClient.incr(`room:${roomId}:players`);
    // 广播
    io.to(roomId).emit('player-joined', { userId, nickname });
    res.json({ success: true, room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'join_failed' });
  } finally {
    client.release();
  }
});

// 获取房间状态
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const client = await pool.connect();
  try {
    const [roomRes, playersRes] = await Promise.all([
      client.query('SELECT * FROM rooms WHERE id = $1', [roomId]),
      client.query(
        `SELECT u.id, u.nickname, u.avatar_url, rp.score, rp.role, rp.is_online 
         FROM room_players rp JOIN users u ON rp.user_id = u.id 
         WHERE rp.room_id = $1`,
        [roomId]
      )
    ]);
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ error: 'room_not_found' });
    }
    res.json({
      room: roomRes.rows[0],
      players: playersRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'fetch_failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
