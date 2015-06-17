// **License:** MIT

/* global module, define */
;(function (root, factory) {
  'use strict'
  /* istanbul ignore next */
  if (typeof module === 'object' && module.exports) module.exports = factory(require('jsonrpc-lite'), require('engine.io-client'))
  else if (typeof define === 'function' && define.amd) define(['jsonrpc-lite', 'engine.io-client'], factory)
  else root.SocketClient = factory(root.jsonrpc, root.eio)
}(typeof window === 'object' ? window : this, function (jsonrpc, Eio) {
  'use strict'

  var DELAY = (Math.ceil(Math.random() * 10) + 10) * 1000

  function SocketClient (options) {
    this.host = options.host
    this.token = options.token
    this.path = options.path || '/websocket'

    this.connectDelay = DELAY
    this.consumerId = null
    this.connection = null
  }

  SocketClient.prototype.onerror = function (err) {
    console.error(new Date().toString(), err.stack || err)
  }

  SocketClient.prototype.onmessage = function () {}

  SocketClient.prototype.joinRoom = function () {}

  SocketClient.prototype.connect = function () {
    var ctx = this
    var query = 'token=' + this.token

    if (this.connection) this.connection.off()

    this.connection = new Eio(this.host, {
      path: this.path,
      rememberUpgrade: true,
      query: query
    })

    this.connection
      .on('open', function () {
        ctx.connectDelay = DELAY
        ctx.consumerId = ctx.connection.id
      })
      .on('close', function (err) {
        ctx.onerror(err)

        setTimeout(function () {
          ctx.connectDelay *= 1.2
          ctx.connect()
        }, ctx.connectDelay)
      })
      .on('error', function (err) {
        ctx.onerror(err)
      })
      .on('message', function (message) {
        var res = jsonrpc.parse(message)

        if (res.type !== 'request') {
          return ctx.onerror(new Error('Unprocessable message: ' + JSON.stringify(res)))
        }

        ctx.connection.send(JSON.stringify(jsonrpc.success(res.payload.id, 'OK')))

        while (res.payload.params.length) parserMessage(ctx, res.payload.params.shift())
      })

  }

  function parserMessage (client, message) {
    try {
      client.onmessage(JSON.parse(message))
    } catch (error) {
      client.onerror(error)
    }
  }

  return SocketClient
}))
