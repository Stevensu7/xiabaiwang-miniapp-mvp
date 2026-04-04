const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'no_token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    const client = await pool.connect();
    const userRes = await client.query(
      'SELECT id, nickname, premium FROM users WHERE id = $1',
      [decoded.userId]
    );
    client.release();
    if (userRes.rows.length === 0) return res.status(403).json({ error: 'user_not_found' });
    req.user = userRes.rows[0];
    next();
  } catch (err) {
    res.status(403).json({ error: 'invalid_token' });
  }
}

async function requireAdmin(req, res, next) {
  // 简单判断：假设 userId = 1 是管理员（实际应查 admin 字段）
  if (req.user.id !== 1) {
    return res.status(403).json({ error: 'admin_only' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
