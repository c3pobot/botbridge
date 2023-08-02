'use strict'
const log = require('logger')
const fetch = require('node-fetch')
const parseResponse = async(res)=>{
  try{
    if(!res) return
    if (res?.status?.toString().startsWith('5')) {
      throw('Bad status code '+res.status)
    }
    let body

    if (res?.status === 204) {
      body = null
    } else if (res?.headers?.get('Content-Type')?.includes('application/json')) {
      body = await res?.json()
    } else {
      body = await res?.text()
    }
    return {
      status: res?.status,
      body: body
    }
  }catch(e){
    throw(e)
  }
}
const fetchRequest = async(uri, opts = {})=>{
  try{
    let res = await fetch(uri, opts)
    return await parseResponse(res)
  }catch(e){
    if(e?.error) return {error: e.name, message: e.message, type: e.type}
    if(e?.status) return await parseResponse(e)
    throw(e)
  }
}
const requestWithRetry = async(uri, opts = {}, count = 0)=>{
  try{
    let res = await fetchRequest(uri, opts)
    if(res?.error === 'FetchError' && 5 >= count){
      count++
      return await requestWithRetry(uri, opts, count)
    }
    return res
  }catch(e){
    throw(e)
  }
}
module.exports = async(uri, payload, method = 'POST', headers = {})=>{
  try{
    let opts = { method: method, compress: true, timeout: 60000, headers: headers }
    if(payload){
      opts.body = JSON.stringify(payload)
      opts.headers['Content-Type'] = 'application/json'
    }
    let res = await requestWithRetry(uri, opts)
    if(res?.body) return res.body
    log.error(res)
  }catch(e){
    throw(e)
  }
}
