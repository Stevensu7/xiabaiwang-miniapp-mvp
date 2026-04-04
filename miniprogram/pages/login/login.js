const app = getApp();

Page({
  data: {},

  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      const { nickName, avatarUrl } = e.detail.userInfo;
      wx.request({
        url: `${app.globalData.apiBase}/auth/login`,
        method: 'POST',
        data: {
          code: '', // 实际需用 wx.login 获取 code
          nickname: nickName,
          avatarUrl: avatarUrl
        },
        success: (res) => {
          if (res.data.token) {
            wx.setStorageSync('token', res.data.token);
            app.globalData.user = res.data.user;
            wx.switchTab({ url: '/pages/lobby/lobby' });
          }
        }
      });
    }
  }
});
