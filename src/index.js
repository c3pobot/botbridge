const log = require('logger')
let logLevel = process.env.LOG_LEVEL || log.Level.INFO;
log.setLevel(logLevel);
const socketServer = require('./socket')
const PORT = process.env.PORT || 3000
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
const server = app.listen(PORT, ()=>{
  log.info('bot bridge is listening on '+server.address()?.port)
  socketServer(server)
})
