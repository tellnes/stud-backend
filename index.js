var net = require('net')
  , http = require('http')
  , cares = process.binding('cares_wrap')
  , inherits = require('util').inherits

const AF_INET = cares.AF_INET
const AF_INET6 = cares.AF_INET6


function read(n, socket, cb) {
  var buf = socket.read(n)
  if (buf) 
    return cb(buf)

  socket.once('readable', read.bind(this, n, socket, cb))
}

function customEmit(ev, req) {
  if (ev === 'request' || ev === 'connect' || ev === 'upgrade' || ev === 'checkContinue') {
    if (req.headers['x-forwarded-for']) {
      req.headers['x-forwarded-for'] += ',' + req.socket.forwardedFor
    } else {
      req.headers['x-forwarded-for'] = req.socket.forwardedFor
    }

    if (req.headers['x-forwarded-port']) {
      req.headers['x-forwarded-port'] += ',' + req.socket.forwardedPort
    } else {
      req.headers['x-forwarded-port'] = '' + req.socket.forwardedPort
    }

    if (req.headers['x-forwarded-proto']) {
      req.headers['x-forwarded-proto'] += ',' + req.socket.forwardedProto
    } else {
      req.headers['x-forwarded-proto'] = req.socket.forwardedProto
    }
  }

  return http.Server.prototype.emit.apply(this, arguments)
}

function connectionListener(socket) {
  var self = this

  function onerror(err) {
    socket.destroy()
  }
  socket.on('error', onerror)

  read(1, socket, function (family) {
    family = family[0]
    if (family === AF_INET) {
      var len = 4
    } else if (family === AF_INET6) {
      var len = 16
    } else {
      socket.destroy()
      return
    }

    read(len, socket, function (ip) {
      var ip = Array.prototype.slice.call(ip).join('.')
      socket.forwardedProto = 'https'
      socket.forwardedPort = 0
      socket.forwardedFor = ip
      socket.removeListener('error', onerror)
      http._connectionListener.call(self, socket)
    })
  })
}

function Server(options, requestListener) {
  if (!(this instanceof Server)) return new Server(options, requestListener)

  if (typeof options === 'function') {
    requestListener = options
    options = {}
  }

  http.Server.call(this, requestListener)

  this.removeListener('connection', http._connectionListener)
  this.on('connection', connectionListener)

  if (options.xforward !== false)
    this.emit = customEmit
}
inherits(Server, http.Server)

module.exports = Server
module.exports.createServer = Server
