const API = 'https://your-domain.com/api';
Page({
  data: { stats: { users: 0, rooms: 0, total_games: 0 } },
  onLoad() {
    const token = wx.getStorageSync('token');
    if (!token) return;
    wx.request({
      url: `${API}/stats/global`,
      header: { Authorization: `Bearer ${token}` },
      success: (res) => this.setData({ stats: res.data })
    });
  },
  refresh() {
    this.onLoad();
  }
});
