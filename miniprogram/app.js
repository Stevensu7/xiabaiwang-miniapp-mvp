App({
  globalData: {
    user: null,
    token: '',
    apiBase: 'https://your-domain.com/api',
    socket: null
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('user');
    if (token) {
      this.globalData.token = token;
      this.globalData.user = user;
    }
  }
});
