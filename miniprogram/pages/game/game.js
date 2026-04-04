const app = getApp();
const API = `${app.globalData.apiBase}`;

Page({
  data: {
    roomId: '',
    userId: null,
    role: '',
    question: '',
    honestAnswer: '',
    draft: '',
    submitted: false,
    players: [],
    allSubmitted: false,
    roundEnded: false,
    resultMessage: '',
    round: 1,
    totalRounds: 3,
    hasNext: true,
    voteTarget: null
  },

  onLoad(options) {
    const token = wx.getStorageSync('token');
    if (!token) return wx.redirectTo({ url: '/pages/login/login' });

    const user = app.globalData.user || wx.getStorageSync('user');
    this.setData({ userId: user.id });

    this.setData({ roomId: options.roomId });
    this.queryRoomState();
    this.connectSocket();
  },

  queryRoomState() {
    wx.request({
      url: `${API}/rooms/${this.data.roomId}`,
      header: { Authorization: `Bearer ${wx.getStorageSync('token')}` },
      success: (res) => {
        const room = res.data.room;
        const players = res.data.players;
        const me = players.find(p => p.id === this.data.userId);
        this.setData({
          role: me.role,
          round: room.current_round,
          totalRounds: room.rounds,
          players: players.filter(p => p.id !== this.data.userId)
        });
        if (me.role === '老实人' && room.status === 'playing') {
          this.setData({ honestAnswer: '诚实者看到这里...' }); // 实际从接口获取题目定义
        }
      }
    });
  },

  connectSocket() {
    const socket = app.globalData.socket || wx.connectSocket({ url: 'wss://your-domain.com' });
    app.globalData.socket = socket;
    socket.onMessage((msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'game-started') {
        this.setData({ question: data.question, role: data.assignments[this.data.userId] });
      }
      if (data.type === 'answer-received') {
        // 更新状态，检查是否所有人都提交了
      }
    });
  },

  onDraft(e) { this.setData({ draft: e.detail.value }); },

  submitAnswer() {
    if (!this.data.draft.trim()) return wx.showToast({ title: '请输入答案', icon: 'none' });
    wx.request({
      url: `${API}/game/${this.data.roomId}/answer`,
      method: 'POST',
      header: { Authorization: `Bearer ${wx.getStorageSync('token')}` },
      data: { answer: this.data.draft }
    });
    this.setData({ submitted: true });
  },

  onVote(e) { this.setData({ voteTarget: parseInt(e.detail.value) }); },

  castVote() {
    if (!this.data.voteTarget) return;
    wx.request({
      url: `${API}/game/${this.data.roomId}/vote`,
      method: 'POST',
      header: { Authorization: `Bearer ${wx.getStorageSync('token')}` },
      data: { targetUserId: this.data.voteTarget },
      success: () => wx.showToast({ title: '投票成功' })
    });
  },

  nextRound() {
    // 请求后端进入下一回合
  },

  endGame() {
    wx.navigateBack();
  }
});
