const socketServer = require('./socket')
const HEALTH_PORT = process.env.HEALTH_PORT || 3000
const express = require('express')
const compression = require('compression')
const bodyParser = require('body-parser');
const app = express()
app.use(bodyParser.json({
  limit: '500MB',
  verify: (req, res, buf)=>{
    req.rawBody = buf.toString()
  }
}))
app.use(compression())
app.get('/healthz', (req, res)=>{
  res.status(200).json({status: 'ok'})
})
const server = app.listen(HEALTH_PORT, ()=>{
  console.log('bot bridge is listening on '+server.address()?.port)
  socketServer(server)
})
