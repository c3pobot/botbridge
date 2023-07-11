const log = require('logger')
const { Server } = require('socket.io')
const BOT_TOTAL_SHARDS = +process.env.BOT_TOTAL_SHARDS || 2
const BOT_TOKEN = process.env.BOT_TOKEN
const BOT_NODE_NAME_PREFIX = process.env.BOT_NODE_NAME_PREFIX || 'bot'
const SOCKET_EMIT_TIMEOUT = process.env.SOCKET_EMIT_TIMEOUT || 10000
let enumShardNum = {}
const remoteSockets = {}

const enumShards = ()=>{
  try{
    let i = BOT_TOTAL_SHARDS
    while(i--){
      enumShardNum[BOT_NODE_NAME_PREFIX+'-'+i] = +i
    }
    if(Object.values(enumShardNum).length === 0) setTimeout(enumShards, 5000)
    log.info(JSON.stringify(enumShardNum))
  }catch(e){
    log.error(e);
    setTimeout(enumShards, 5000)
  }
}
const getBotShardNum = (obj = {}, socket)=>{
  try{
    if(!obj.podName || BOT_TOKEN !== obj.botToken) return
    let res = { totalShards: BOT_TOTAL_SHARDS, shardNum: enumShardNum[obj.podName] }
    if(res.shardNum >= 0 && res.totalShards >= 0){
      remoteSockets[obj.podName] = socket
      return res
    }
  }catch(e){
    throw(e.message || e)
  }
}
const getShardId = async(obj = {})=>{
  try{
    if(!obj.sId) return
    let id = (Number(BigInt(obj.sId) >> 22n) % (+BOT_TOTAL_SHARDS))
    if(id >= 0) return BOT_NODE_NAME_PREFIX+'-'+id
  }catch(e){
    throw(e.message || e);
  }
}
const getRemoteRequest = (cmd, obj = {})=>{
  if(!remoteSockets[obj.podName] || !remoteSockets[obj.podName]?.connected) throw('Socket Error: '+obj.podName+' connection not available')
  return new Promise((resolve, reject)=>{
    try{
      remoteSockets[obj.podName].timeout(SOCKET_EMIT_TIMEOUT).emit('request', cmd, obj, (err, res)=>{
        if(err) reject(`Socket Error: ${err.message || err}`)
        resolve(res)
      })
    }catch(e){
      log.error(e);
      reject(e.message || e)
    }
  })
}
const getRemoteRequestAllBots = async(cmd, obj)=>{
  try{
    let resArray = [], i = BOT_TOTAL_SHARDS
    while(i--){
      let podName = BOT_NODE_NAME_PREFIX+'-'+i
      if(!remoteSockets[podName]) continue;
      obj.podName = podName
      let res = await getRemoteRequest(podName, cmd, obj)
      if(res) resArray.push(res)
    }
    return resArray
  }catch(e){
    log.error(e);
  }
}
const identifySocket = (obj = {}, socket)=>{
  try{
    if(obj.podName){
      remoteSockets[obj.podName] = socket
      return({status: 'ok'})
    }
  }catch(e){
    throw(e.message || e)
  }
}
const processRequest = async(cmd, obj = {}, socket)=>{
  try{
    log.debug(JSON.stringify(obj))
    if(cmd === 'identify') return await identifySocket(obj, socket)
    if(cmd === 'getBotShardNum') return await getBotShardNum(obj, socket)
    let podName = obj.podName
    if(!podName) podName = await getShardId(obj)
    log.debug('found '+podName+' for '+obj.sId)
    if(podName === 'all') return await getRemoteRequestAllBots(cmd, obj)
    if(podName){
      obj.podName = podName
      return await getRemoteRequest(cmd, obj)
    }
  }catch(e){
    throw(e.message || e)
  }
}
enumShards()
module.exports = (server)=>{
  try{
    io = new Server(server, {maxHttpBufferSize: 1e8, cors: { origin: ['*']}})
    log.info('bot bridge socket server is listening on port '+server.address()?.port)
    io.on('connection', (socket)=>{
      socket.on('connect', ()=>{
        log.debug(socket.id+' is connected to bot bridge')
      })
      socket.on('request', async(cmd, obj = {}, callback)=>{
        try{
          let res = await processRequest(cmd, obj, socket)
          if(callback) callback(res)
        }catch(e){
          log.log(e.message || e)
          if(callback) callback()
        }
      })
    })
  }catch(e){
    log.error(e)
  }
}
