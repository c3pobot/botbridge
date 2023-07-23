const log = require('logger')
let logLevel = process.env.LOG_LEVEL || log.Level.INFO;
log.setLevel(logLevel);
const handleRequest = require('./handleRequest')
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
app.post('/cmd', (req, res)=>{
  handleRequest(req, res)
})
const server = app.listen(PORT, ()=>{
  log.info('bot bridge is listening on '+server.address()?.port)
})
