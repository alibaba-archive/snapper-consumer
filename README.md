snapper2-consumer
===
snapper2 consumer client for node.js and browser.

**`Snapper2-consumer` is tested in `Snapper2`**

## Snapper2 https://code.teambition.com/server/snapper2

## Demo

```coffee
# module: socket.coffee
define((require, exports, module) ->
  Backbone   = require('backbone')
  Consumer   = require('consumer')
  http       = require('lib/http-thunks')

  class SocketClient extends Consumer
    onmessage: (message, type) ->
      if type isnt 'request'
        return @onerror(new Error('It is not a request: ' + JSON.stringify(message)))
      # parse multi sub-messages
      while message.params.length
        try
          data = JSON.parse(message.params.shift())
          if data and typeof data.e is 'string'
            @trigger(data.e, data.d)
          else
            @onerror(new Error('Unprocessable entity: ' + JSON.stringify(data)))
        catch err
          @onerror(err)

    _join: (room, consumerId) ->
      # join a room by API server
      http.post("#{room}/subscribe", {consumerId: consumerId})()

  _.extend(SocketClient.prototype, Backbone.Events)
  return new SocketClient()
)

# ---------------------------
# connect to server
socketClient.connect(teambition.pushHost, {
  path: '/websocket'
  token: teambition.user.get('snapperToken')
})

# listen for messages
socketClient.on('xxx', (data) -> )
```


## API

```js
var Consumer = require('snapper2-consumer')
```

### new Consumer([host][, options])

```js
var consumer = new Consumer()
```
- `host`: `String`, Snapper2 server host.
- `options`: `Object`, `engine.io-client` options, but added `options.token`.

### consumer.prototype.onerror(error)

- `error`: `Error Object`.

Default error listener, overwrite it in production.

### consumer.prototype.onmessage(message, type)

- `message`: `Mixed`, JSON-RPC message.
- `type`: `String`, JSON-RPC type, `'invalid'`, `'notification'`, `'success'`, `'error'`, `'request'`.

Default messages listener, overwrite it in production.

### consumer.prototype.send(method, message[, callback])

- `method`: `String`, JSON-RPC method.
- `message`: `Mixed`, JSON-RPC message.
- `callback`: `function`, response callback.

Send a JSON-RPC request to server.

### consumer.prototype.join(room), consumer.prototype._join(room, consumerId)

- `room`: `String`, room name.

`_join` method should be implemented for this method.

### consumer.prototype.connect([host][, options])

- `host`: `String`, Snapper2 server host.
- `options`: `Object`, `engine.io-client` options, but added `options.token`.

Connect to server. The arguments is the same as constructor, should be provided in constructor or here.
