const express = require('express');
const { pool } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取题库（可分页、分类）
router.get('/', authenticateToken, async (req, res) => {
  const { page = 1, limit = 20, category } = req.query;
  const offset = (page - 1) * limit;
  const client = await pool.connect();
  try {
    let where = '';
    const params = [limit, offset];
    if (category) {
      where = 'WHERE category = $3';
      params.push(category);
    }
    const q = `
      SELECT q.*, u.nickname as created_by_nickname
      FROM questions q
      LEFT JOIN users u ON q.created_by = u.id
      ${where}
      ORDER BY used_count DESC, id DESC
      LIMIT $1 OFFSET $2
    `;
    const [result, countRes] = await Promise.all([
      client.query(q, params),
      client.query(`SELECT COUNT(*) FROM questions ${where}`, params)
    ]);
    res.json({ questions: result.rows, total: parseInt(countRes.rows[0].count), page: parseInt(page) });
  } finally {
    client.release();
  }
});

// 添加题目（管理员或创建者）
router.post('/', authenticateToken, async (req, res) => {
  const { term, definition, difficulty = 1, category } = req.body;
  const created_by = req.user.userId;
  const client = await pool.connect();
  try {
    const resDB = await client.query(
      `INSERT INTO questions (term, definition, difficulty, category, created_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [term, definition, difficulty, category, created_by]
    );
    res.json({ question: resDB.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'create_failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
