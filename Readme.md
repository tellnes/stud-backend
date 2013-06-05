# stud-backend

Use the `--write-ip` flag on stud and get the remote ip in node.

## Usage

```js
var studServer = require('stud-backend')

studServer.createServer(function (req, res) {
  console.log(req.socket._ip)
  res.end(req.headers['x-forwared-for'] + '\n')
}).listen(8080)
```

## Install

    $ npm install stud-backend

## License

MIT
