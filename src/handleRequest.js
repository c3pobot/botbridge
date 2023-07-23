'use strict'
const log = require('logger')
const fetch = require('./fetch')
const deepCopy = require('./deepCopy')

const BOT_TOTAL_SHARDS = +process.env.BOT_TOTAL_SHARDS || 2
const BOT_TOKEN = process.env.BOT_TOKEN
const BOT_NODE_NAME_PREFIX = process.env.BOT_NODE_NAME_PREFIX || 'bot'
const BOT_SVC = process.env.BOT_SVC || 'bot:3000'

let enumShardNum = {}, Cmds = {}
const enumShards = ()=>{
  try{
    let i = BOT_TOTAL_SHARDS
    while(i--) enumShardNum[BOT_NODE_NAME_PREFIX+'-'+i] = { id: +i, podName: BOT_NODE_NAME_PREFIX+'-'+i, url: 'http://'+BOT_NODE_NAME_PREFIX+'-'+i+'.'+BOT_SVC+'/cmd' }
    if(Object.values(enumShardNum).length === 0) setTimeout(enumShards, 5000)
    log.info(JSON.stringify(enumShardNum))
  }catch(e){
    log.error(e)
    setTimeout(enumShards, 5000)
  }
}
Cmds.getBotShardNum = ( obj = {} )=>{
  try{
    if(!obj.podName || BOT_TOKEN !== obj.botToken) return
    return { totalShards: BOT_TOTAL_SHARDS, shardNum: enumShardNum[obj.podName]?.id }
  }catch(e){
    throw(e)
  }
}
const getRemoteRequest = async(obj = {})=>{
  try{
    if(!enumShardNum[obj.podName]?.url) throw(obj.podName+' connection not available')
    return await fetch(enumShardNum[obj.podName]?.url, obj)
  }catch(e){
    throw(e)
  }
}
const getRemoteRequestAllBots = async(obj = {})=>{
  try{
    let res = [], i = BOT_TOTAL_SHARDS
    while(i--){
      let podName = BOT_NODE_NAME_PREFIX+'-'+i
      let tempObj = deepCopy(obj)
      tempObj.podName = podName
      res.push(getRemoteRequest(tempObj))
    }
    await Promise.all(res)
    if(res.length > 0) return res
  }catch(e){
    throw(e);
  }
}
const getPodName = async(obj = {})=>{
  try{
    if(!obj.sId) return
    let id = (Number(BigInt(obj.sId) >> 22n) % (+BOT_TOTAL_SHARDS))
    if(id >= 0) return BOT_NODE_NAME_PREFIX+'-'+id
  }catch(e){
    throw(e);
  }
}
const processRequest = async(obj = {})=>{
  try{
    log.debug(JSON.stringify(obj))
    if(Cmds[obj.cmd]) return await Cmds[obj.cmd](obj)
    let podName = obj.podName
    if(!podName) podName = await getPodName(obj)
    log.debug('found '+podName+' for '+obj.sId)
    if(podName === 'all') return await getRemoteRequestAllBots(obj)
    if(podName){
      obj.podName = podName
      return await getRemoteRequest(obj)
    }
  }catch(e){
    throw(e)
  }
}
enumShards()
module.exports = async(req, res)=>{
  try{
    if(!req?.body?.cmd){
      res.sendStatus(400)
      return
    }
    let response = await processRequest(req.body)
    if(response){
      res.status(200).json(response)
    }else{
      res.status(400)
    }
  }catch(e){
    log.error(e)
    res.sendStatus(400)
  }
}
