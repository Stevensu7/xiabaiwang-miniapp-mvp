const express = require('express');
const { pool } = require('../models/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 个人战绩
router.get('/me', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const client = await pool.connect();
  try {
    const [games, stats] = await Promise.all([
      client.query(
        `SELECT r.id, r.status, r.current_round, rp.score, rp.role
         FROM room_players rp
         JOIN rooms r ON rp.room_id = r.id
         WHERE rp.user_id = $1
         ORDER BY r.created_at DESC LIMIT 20`,
        [userId]
      ),
      client.query(
        `SELECT 
           COUNT(*) as total_games,
           SUM(CASE WHEN rp.role = '大聪明' THEN 1 ELSE 0 END) as big_smart_games,
           SUM(CASE WHEN rp.role = '老实人' THEN 1 ELSE 0 END) as honest_games,
           AVG(rp.score) as avg_score
         FROM room_players rp
         JOIN rooms r ON rp.room_id = r.id
         WHERE rp.user_id = $1`,
        [userId]
      )
    ]);
    res.json({ games: games.rows, stats: stats.rows[0] });
  } finally {
    client.release();
  }
});

// 全局统计（仅管理员）
router.get('/global', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const [users, rooms, games] = await Promise.all([
      client.query('SELECT COUNT(*) FROM users'),
      client.query('SELECT COUNT(*) FROM rooms'),
      client.query('SELECT COUNT(*) FROM room_players')
    ]);
    res.json({
      users: users.rows[0].count,
      rooms: rooms.rows[0].count,
      total_games: games.rows[0].count
    });
  } finally {
    client.release();
  }
});

module.exports = router;
