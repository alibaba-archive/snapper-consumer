// **License:** MIT

/* global module, define */
;(function (root, factory) {
  'use strict'

  if (typeof module === 'object' && module.exports) module.exports = factory(require('jsonrpc-lite'), require('engine.io-client'))
  else if (typeof define === 'function' && define.amd) define(['jsonrpc-lite', 'engine.io-client'], factory)
  else root.MessageClient = factory(root.jsonrpc, root.eio)

}(typeof window === 'object' ? window : this, function (jsonrpc, Eio) {
  'use strict'

  var DELAY = (Math.ceil(Math.random() * 10) + 10) * 1000

  function MessageClient (host, options) {
    this.host = host
    this.options = options || {}

    this.connectDelay = DELAY
    this.lastRpcId = null
    this.consumerId = null
    this.connection = null
    this.connected = false
    this.joinQueue = []
    this.sendQueue = []
    this.pending = {}
  }

  MessageClient.prototype.onerror = function (err) {
    console.error(new Date(), err.stack || err)
  }

  MessageClient.prototype.onmessage = function (message) {
    console.log(new Date(), message)
  }

  MessageClient.prototype.send = function (method, message, callback) {
    var packet
    if (method != null) {
      packet = new Packet(method, message, callback)
      this.pending[packet.id] = packet
      this.sendQueue.push(packet)
    }
    if (!this.connected) return this

    while (this.sendQueue.length) {
      packet = this.sendQueue.shift()
      this.connection.send(packet.message)
    }
    return this
  }

  MessageClient.prototype.join = function (room) {
    if (room != null) this.joinQueue.push(room)
    if (!this.connected) return this
    while (this.joinQueue.length) this._join(this.joinQueue.shift(), this.consumerId)
    return this
  }

  MessageClient.prototype._join = function (room, consumerId) {
    throw new Error('not implemented')
  }

  MessageClient.prototype.connect = function () {
    var ctx = this
    if (this.connection) this.connection.off()

    if (this.options.token && !this.options.query) this.options.query = 'token=' + this.token
    this.connection = new Eio(this.host, this.options)

    this.connection
      .on('open', function () {
        ctx.connectDelay = DELAY
        ctx.consumerId = ctx.connection.id
        this.connected = true
        ctx.join()
        ctx.send()
      })
      .on('close', function (err) {
        this.connected = false
        this.connection = null
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

        switch (res.type) {
          case 'invalid':
            return ctx.onerror(res.payload)

          case 'notification':
            return ctx.onmessage(res.payload)

          case 'success':
          case 'error':
            if (ctx.pending[res.payload.id]) {
              ctx.pending[res.payload.id].callback(res.payload.error, res.payload.result)
              delete ctx.pending[res.payload.id]
            } else {
              ctx.onmessage(res.payload)
            }
            return

          case 'request':
            ctx.connection.send(JSON.stringify(jsonrpc.success(res.payload.id, 'OK')))
            if (res.payload.id === ctx.lastRpcId) return
            ctx.lastRpcId = res.payload.id
            ctx.onmessage(res.payload)
        }
      })

  }

  function Packet (method, message, callback) {
    this.id = genRpcId()
    this.message = JSON.stringify(jsonrpc.request(this.id, method, message))
    this.callback = callback || noOp
  }

  var count = 0
  function genRpcId () {
    return 'MC:' + (++count)
  }

  function noOp () {}

  return MessageClient
}))
