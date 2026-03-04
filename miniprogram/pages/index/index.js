Page({
  data:{
    playersInput:'小明,小红,小刚',started:false,players:[],idx:0,draft:'',fakes:{},
    card:{q:'“黑天鹅事件”在投资里常指？',a:'低概率但高冲击的意外事件'},
    scores:{},scoreList:[]
  },
  onPlayersInput(e){this.setData({playersInput:e.detail.value})},
  onDraft(e){this.setData({draft:e.detail.value})},
  startGame(){
    const players=this.data.playersInput.split(',').map(s=>s.trim()).filter(Boolean)
    if(players.length<3){wx.showToast({title:'至少3人',icon:'none'});return}
    const scores={};players.forEach(p=>scores[p]=0)
    this.setData({started:true,players,idx:0,fakes:{},scores,currentPlayer:players[0],scoreList:players.map(p=>({name:p,score:0}))})
  },
  submitDraft(){
    const {players,idx,draft,fakes}=this.data
    if(!draft.trim()){wx.showToast({title:'请输入答案',icon:'none'});return}
    fakes[players[idx]]=draft.trim()
    const next=idx+1
    if(next<players.length){this.setData({fakes,idx:next,currentPlayer:players[next],draft:''});return}
    wx.showModal({title:'MVP提示',content:'小程序版已完成到提交环节，投票结算逻辑在web MVP与下个迭代实现。',showCancel:false})
  }
})
