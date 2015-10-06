snapper-consumer
===
snapper consumer client for node.js and browser.

**`Snapper-consumer` is tested in `Snapper`**

## [Snapper-core](https://github.com/teambition/snapper-core) Teambition push messaging service

## Demo

```coffee
# module: socket.coffee
define((require, exports, module) ->
  Backbone   = require('backbone')
  Consumer   = require('consumer')
  http       = require('lib/http-thunks')

  class SocketClient extends Consumer
    onmessage: (event) ->
      if event.type isnt 'request'
        return @onerror(new Error('It is not a request: ' + JSON.stringify(event.data)))
      # parse multi sub-messages
      while event.data.params.length
        try
          data = JSON.parse(event.data.params.shift())
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
var Consumer = require('snapper-consumer')
```

### new Consumer([url][, options])

```js
var consumer = new Consumer()
```
- `url`: `String`, Snapper server host.
- `options`: `Object`, `engine.io-client` options, but added `options.token`.

### consumer.prototype.onopen()

### consumer.prototype.onclose()

### consumer.prototype.onerror(error)

- `error`: `Error Object`.

Default error listener, overwrite it in production.

### consumer.prototype.onmessage(event)

- `event.id`: `String|Number|null|undefined`, JSON-RPC id
- `event.data`: `Object`, JSON-RPC object.
- `event.type`: `String`, JSON-RPC type, `'invalid'`, `'notification'`, `'success'`, `'error'`, `'request'`.

Default messages listener, overwrite it in production.

### consumer.prototype.request(method[, params][, callback])

- `method`: `String`, JSON-RPC request method.
- `params`: `Mixed`, JSON-RPC request params.
- `callback`: `function`, response callback.

Send a JSON-RPC request to server.

### consumer.prototype.join(room), consumer.prototype._join(room, consumerId)

- `room`: `String`, room name.

`_join` method should be implemented for this method.

### consumer.prototype._respond(event)

It is used to respond server's request.

### consumer.prototype.connect([url][, options])

- `url`: `String`, Snapper server host.
- `options`: `Object`, `engine.io-client` options, but added `options.token`.

Connect to server. The arguments is the same as constructor, should be provided in constructor or here.

### consumer.prototype.close()

Close the client.
