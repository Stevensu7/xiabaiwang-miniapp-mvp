const app = getApp();
const API = `${app.globalData.apiBase}`;

Page({
  data: {
    user: {},
    maxPlayers: 6,  // 默认 6 人
    rounds: 3,
    roomId: '',
    playerName: '',
    winRate: 0,
    totalGames: 0,
    recentGames: []
  },

  onLoad() {
    const user = app.globalData.user || wx.getStorageSync('user');
    if (!user) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({ user });
    this.loadStats();
  },

  loadStats() {
    wx.request({
      url: `${API}/stats/me`,
      header: { Authorization: `Bearer ${wx.getStorageSync('token')}` },
      success: (res) => {
        if (res.data.stats) {
          const total = parseInt(res.data.stats.total_games) || 0;
          const wins = 0; // TODO 计算
          const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
          this.setData({ winRate, totalGames: total, recentGames: res.data.games || [] });
        }
      }
    });
  },

  onMaxPlayersChange(e) { this.setData({ maxPlayers: e.detail.value }); },
  onRoundsChange(e) { this.setData({ rounds: e.detail.value }); },
  onRoomIdInput(e) { this.setData({ roomId: e.detail.value }); },
  onPlayerNameInput(e) { this.setData({ playerName: e.detail.value }); },

  createRoom() {
    wx.request({
      url: `${API}/rooms`,
      method: 'POST',
      header: { Authorization: `Bearer ${wx.getStorageSync('token')}` },
      data: { maxPlayers: this.data.maxPlayers, rounds: this.data.rounds },
      success: (res) => {
        if (res.data.room) {
          wx.navigateTo({ url: `/pages/game/game?roomId=${res.data.room.id}` });
        }
      }
    });
  },

  joinRoom() {
    const { roomId, playerName } = this.data;
    if (!roomId || !playerName) return wx.showToast({ title: '请填写完整', icon: 'none' });
    wx.request({
      url: `${API}/rooms/${roomId}/join`,
      method: 'POST',
      header: { Authorization: `Bearer ${wx.getStorageSync('token')}` },
      data: { nickname: playerName },
      success: (res) => {
        if (res.data.success) {
          wx.navigateTo({ url: `/pages/game/game?roomId=${roomId}` });
        } else {
          wx.showToast({ title: res.data.error || '加入失败', icon: 'none' });
        }
      }
    });
  }
});
