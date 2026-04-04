const app = getApp();
Page({
  data: { user: {} },
  onLoad() {
    this.setData({ user: app.globalData.user || wx.getStorageSync('user') });
  },
  openVip() {
    wx.showModal({ title: '开通 VIP', content: '功能开发中，敬请期待', showCancel: false });
  },
  viewHistory() {
    wx.showToast({ title: '开发中', icon: 'none' });
  },
  about() {
    wx.showModal({ title: '关于瞎掰王', content: '版本：1.0.0\n一个谎言与辩解的社交游戏', showCancel: false });
  }
});
