var studServer = require('./')

studServer.createServer(function (req, res) {
  console.log(req.socket._ip)
  res.end(req.headers['x-forwared-for'] + '\n')
}).listen(8080)
