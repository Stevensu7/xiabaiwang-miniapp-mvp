const express = require('express');
const { pool } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 创建订单（会员/道具）
router.post('/create', authenticateToken, async (req, res) => {
  const { type, amount } = req.body; // type: 'premium', 'item'
  const userId = req.user.userId;
  const orderId = `ORD-${Date.now()}-${userId}`;
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO orders (id, user_id, type, amount) 
       VALUES ($1, $2, $3, $4)`,
      [orderId, userId, type, amount]
    );
    // 微信支付统一下单（需商户密钥、证书等）
    // 这里返回模拟数据
    const paymentParams = {
      orderId,
      amount,
      prepayId: `MOCK-${orderId}`
    };
    res.json({ success: true, paymentParams });
  } catch (err) {
    res.status(500).json({ error: 'create_order_failed' });
  } finally {
    client.release();
  }
});

// 支付回调（微信）
router.post('/callback', async (req, res) => {
  // 验证签名、更新订单状态、给用户加权益
  res.send('ok'); // 微信要求 plain text
});

module.exports = router;
