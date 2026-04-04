require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('../routes/auth');
const roomRoutes = require('../routes/rooms');
const gameRoutes = require('../routes/game');
const questionRoutes = require('../routes/questions');
const paymentRoutes = require('../routes/payment');
const statsRoutes = require('../routes/stats');

const { initDB } = require('../models/db');
const { redisClient } = require('../config/redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/stats', statsRoutes);

// Socket.IO 连接
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', async ({ roomId, userId }) => {
    socket.join(roomId);
    // 更新房间在线人数（可存入 Redis）
    await redisClient.incr(`room:${roomId}:online`);
    socket.to(roomId).emit('user-joined', { userId, roomId });
  });

  socket.on('game-state', ({ roomId, state }) => {
    socket.to(roomId).emit('state-updated', state);
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 初始化
async function start() {
  try {
    await initDB();
    await redisClient.connect();
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}

start();

module.exports = { app, server, io };
