# 瞎掰王 (9UPPER) — 完全商业版

> 谎言与辩解的社交游戏，适合聚会、团建、线上开黑

[![GitHub stars](https://img.shields.io/github/stars/Stevensu7/xiabaiwang-miniapp-mvp)](https://github.com/Stevensu7/xiabaiwang-miniapp-mvp/stargazers)
[![license](https://img.shields.io/github/license/Stevensu7/xiabaiwang-miniapp-mvp)](LICENSE)

## ✨ 功能特性

- 🎮 **核心玩法**：大聪明×1 + 老实人×1 + 瞎掰王×（N-2）
- 🏠 **房间制**：推荐 4–12 人（最少 4 人），可自定义人数上限
- 💬 **实时对战**：基于 WebSocket 的低延迟同步
- 📚 **题库系统**：后台管理，支持分类与难度
- 👑 **VIP 会员**：去广告、专属房间、称号
- 📊 **数据统计**：个人战绩、全局大盘
- 🌗 **暗色模式**：全新 UI 设计系统

---

## 🏗️ 架构总览

```
┌─────────────┐        ┌─────────────────────────────┐
│  微信小程序  │───────▶│  Node.js + Socket.IO 后端    │
└─────────────┘        └─────────────────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │   PostgreSQL     │
                          │   + Redis        │
                          └──────────────────┘
```

**技术栈**：
- 前端：微信小程序原生框架（WXML/WXSS/JS）
- 后端：Node.js + Express + Socket.IO
- 数据库：PostgreSQL（持久） + Redis（缓存/会话）
- 部署：Docker + Nginx（提供 HTTPS + WSS）

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Stevensu7/xiabaiwang-miniapp-mvp.git
cd xiabaiwang-miniapp-mvp
```

### 2. 后端部署

```bash
cd server
cp .env.example .env
# 编辑 .env，配置数据库和微信参数
npm install
npm run dev   # 开发模式
# 或
npm start     # 生产模式
```

数据库初始化（需提前创建数据库）：

```sql
-- 运行 server/models/db.js 会自动建表
```

### 3. 小程序端配置

在微信开发者工具中打开 `miniprogram/` 目录：
- 填入你的小程序 AppID
- 修改 `app.js` 中的 `apiBase` 为后端地址

### 4. 管理后台

访问 `/pages/admin/`（需管理员 token，在数据库中设置 `users.id=1` 为管理员）。

---

## 🎯 核心接口

### 认证
- `POST /auth/login` — 微信登录（需 code）

### 房间
- `POST /rooms` — 创建房间
- `POST /rooms/:id/join` — 加入房间
- `GET /rooms/:id` — 房间状态

### 游戏
- `POST /game/:roomId/start` — 开始游戏
- `POST /game/:roomId/answer` — 提交答案
- `POST /game/:roomId/vote` — 投票

### 题库
- `GET /questions` — 获取题目（可分页）
- `POST /questions` — 添加题目（管理）

### 支付
- `POST /payment/create` — 创建订单（会员/道具）

---

## 💰 商业化配置

### 会员体系

| 权益 | 免费用户 | VIP 会员 |
|------|----------|----------|
| 广告 | 有 | 无 |
| 房间上限 | 3个 | 不限 |
| 自定义房间号 | ❌ | ✅ |
| 专属标识 | ❌ | ✅ |

### 道具系统（规划）
- 身份查看器：在投票前可查看某玩家身份
- 双倍积分卡：本局获胜积分翻倍
- 免坑卡：被投出后可复活

### 广告位
- 游戏结束页横幅
- 个人中心底部原生模板
- Banner 插屏（每局一次可选）

---

## 📊 数据库 Schema

主要表：

- `users` — 用户信息（openid、昵称、头像、VIP 状态）
- `rooms` — 房间信息（房主、人数、局数、状态）
- `room_players` — 玩家在房间中的信息（角色、得分）
- `game_rounds` — 每回合记录（题目、身份分配、投票、结算）
- `questions` — 题库
- `orders` — 订单记录

索引已覆盖高频查询。

---

## 🔒 安全与合规

- API 限流：15 分钟 100 次（可调）
- JWT Token：30 天过期，支持刷新
- SQL 防注入：参数化查询
- 支付回调签名校验
- 遵循微信小程序运营规范

---

## 📱 界面预览

**全新 UI 设计系统**（2026-04-04 更新）

- 主色：Indigo `#6366F1`
- 圆角：24rpx
- 响应式布局
- 暗色模式自动适配

在线体验：

- **GitHub Pages**: https://stevensu7.github.io/xiabaiwang-miniapp-mvp/
- **Web 试玩版（无需小程序）**: https://stevensu7.github.io/xiabaiwang-miniapp-mvp/docs/web-demo.html

**试玩说明**：
- 直接在浏览器打开 `docs/web-demo.html`
- 输入玩家昵称（逗号分隔），设定人数（4–12）
- 体验完整游戏流程（模拟多人）

---

## 🛠️ 开发指南

### 目录结构

```
├── miniprogram/      # 微信小程序
│   ├── pages/
│   │   ├── login/   # 登录页
│   │   ├── lobby/   # 大厅
│   │   ├── game/    # 游戏页
│   │   ├── profile/ # 个人中心
│   │   └── admin/   # 管理后台
│   └── app.js
├── server/           # 后端服务
│   ├── src/
│   ├── routes/
│   ├── models/
│   └── config/
├── docs/
└── README.md
```

### 本地开发

```bash
# 后端
cd server && npm run dev

# 小程序
# 在微信开发者工具中打开 miniprogram/ 目录
```

---

## 📝 路线图

- [x] MVP 核心玩法
- [x] UI 现代化重构
- [x] 后端基础框架
- [ ] 微信登录真实对接
- [ ] 微信支付接入
- [ ] 题库后台管理界面（Web）
- [ ] 好友邀请分享
- [ ] AI 自动生成题目

---

## 🤝 贡献

欢迎 PR 或 Issue！

## 📄 许可证

MIT

---

*Made with ❤️ by OpenClaw Design Agent*
