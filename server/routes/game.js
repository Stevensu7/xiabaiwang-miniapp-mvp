const express = require('express');
const { pool } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 开始游戏（房主）
router.post('/:roomId/start', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId;
  const client = await pool.connect();
  try {
    // 验证房主
    const roomRes = await client.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomRes.rows.length === 0) return res.status(404).json({ error: 'room_not_found' });
    const room = roomRes.rows[0];
    if (room.owner_id !== userId) return res.status(403).json({ error: 'not_owner' });

    // 获取玩家列表
    const playersRes = await client.query(
      'SELECT * FROM room_players WHERE room_id = $1',
      [roomId]
    );
    const players = playersRes.rows;
    const n = players.length;
    if (n < 3) return res.status(400).json({ error: 'not_enough_players' });

    // 随机分配角色：1 大聪明，1 老实人，其余 瞎掰王
    const indices = Array.from({ length: n }, (_, i) => i);
    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
    shuffle(indices);
    const assignments = {};
    assignments[players[indices[0]].user_id] = '大聪明';
    assignments[players[indices[1]].user_id] = '老实人';
    for (let i = 2; i < n; i++) {
      assignments[players[indices[i]].user_id] = '瞎掰王';
    }

    // 更新玩家角色
    for (const p of players) {
      await client.query(
        'UPDATE room_players SET role = $1 WHERE room_id = $2 AND user_id = $3',
        [assignments[p.user_id], roomId, p.user_id]
      );
    }

    // 随机选题
    const qRes = await client.query(
      'SELECT * FROM questions ORDER BY RANDOM() LIMIT 1'
    );
    const question = qRes.rows[0];

    // 更新房间状态
    await client.query(
      'UPDATE rooms SET status = $1, current_round = 1 WHERE id = $2',
      ['playing', roomId]
    );

    // 广播游戏开始
    io.to(roomId).emit('game-started', {
      round: 1,
      question: question.term,
      assignments // 实际应只发给对应用户
    });

    res.json({ success: true, question: question.term });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'start_failed' });
  } finally {
    client.release();
  }
});

// 玩家提交答案
router.post('/:roomId/answer', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const { answer } = req.body;
  const userId = req.user.userId;
  // 简化为存储到 Redis，实际应存入 DB
  const key = `answer:${roomId}:${userId}`;
  await redisClient.setEx(key, 1800, answer);
  io.to(roomId).emit('answer-received', { userId });
  res.json({ success: true });
});

// 投票（仅大聪明）
router.post('/:roomId/vote', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const { targetUserId } = req.body;
  const userId = req.user.userId;
  // 验证投票者是大聪明
  const client = await pool.connect();
  try {
    const pRes = await client.query(
      'SELECT role FROM room_players WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
    if (pRes.rows.length === 0 || pRes.rows[0].role !== '大聪明') {
      return res.status(403).json({ error: 'not_big_smart' });
    }
    // 记录投票
    await redisClient.set(`vote:${roomId}`, targetUserId, 'EX', 300);
    io.to(roomId).emit('vote-cast', { userId, targetUserId });
    res.json({ success: true });
  } finally {
    client.release();
  }
});

// 计分结算（简化版）
router.post('/:roomId/resolve', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  // 实现计分逻辑：
  // 1. 获取所有答案
  // 2. 检查诚实者答案是否正确
  // 3. 根据投票结果给出分数
  // 这里简化返回
  res.json({ success: true, scores: {} });
});

module.exports = router;
