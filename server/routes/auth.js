const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');

const router = express.Router();

// 微信登录（假实现，实际需微信 SDK）
router.post('/login', async (req, res) => {
  const { code, nickname, avatarUrl } = req.body;
  // TODO: 用 code 换取 openid（微信 API）
  // 这里简化：生成一个假 openid
  const openid = code; // 仅演示用
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userRes = await client.query(
      'SELECT * FROM users WHERE openid = $1',
      [openid]
    );
    let user = userRes.rows[0];
    if (!user) {
      const insert = await client.query(
        `INSERT INTO users (openid, nickname, avatar_url) 
         VALUES ($1, $2, $3) RETURNING *`,
        [openid, nickname, avatarUrl]
      );
      user = insert.rows[0];
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '30d' }
    );
    await client.query('COMMIT');
    res.json({ token, user: { id: user.id, nickname: user.nickname, avatar_url: user.avatar_url, premium: user.premium } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'login_failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
