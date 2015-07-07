// **License:** MIT

/* global module, define */
;(function (root, factory) {
  'use strict'

  if (typeof module === 'object' && module.exports) module.exports = factory(require('jsonrpc-lite'), require('engine.io-client'))
  else if (typeof define === 'function' && define.amd) define(['jsonrpc-lite', 'engine.io-client'], factory)
  else root.Consumer = factory(root.jsonrpc, root.eio)

}(typeof window === 'object' ? window : this, function (jsonrpc, Eio) {
  'use strict'

  var DELAY = (Math.ceil(Math.random() * 10) + 10) * 1000
  var TIMEOUT = 60 * 1000

  function Consumer (url, options) {
    this.url = url
    this.options = options || {}
    this.reconnectionTime = DELAY

    this.lastId = null
    this.consumerId = null
    this.connection = null
    this.connected = false
    this.joinQueue = []
    this.sendQueue = []
    this.pending = {}
  }

  Consumer.prototype.onopen = noOp
  Consumer.prototype.onclose = noOp

  Consumer.prototype.onerror = function (error) {
    console.error(new Date(), error)
  }

  Consumer.prototype.onmessage = function (event) {
    console.log(new Date(), event.type, event.data)
  }

  Consumer.prototype.request = function (method, params, callback) {
    this.sendQueue.push(new RpcCommand(this.pending, method, params, callback))
    flushRequest(this)
    return this
  }

  Consumer.prototype.join = function (room) {
    this.joinQueue.push(room)
    flushJoin(this)
    return this
  }

  Consumer.prototype._join = function (room, consumerId) {
    throw new Error('not implemented')
  }

  Consumer.prototype._respond = function (event) {
    this.connection.send(JSON.stringify(jsonrpc.success(event.id, 'OK')))
  }

  Consumer.prototype.connect = function (url, options) {
    var ctx = this

    if (url) this.url = url
    if (options) this.options = options
    if (this.options.token && !this.options.query) this.options.query = 'token=' + this.options.token

    this.connection = new Eio(this.url, this.options)
    this.connection
      .on('open', function () {
        ctx.reconnectionTime = DELAY
        ctx.consumerId = this.id
        ctx.connected = true
        ctx.onopen()
        flushJoin(ctx)
        flushRequest(ctx)
      })
      .on('close', function (err) {
        if (err) ctx.onerror(err)
        ctx.close()

        setTimeout(function () {
          ctx.reconnectionTime *= 1.2
          if (ctx.reconnectionTime > TIMEOUT) ctx.reconnectionTime = TIMEOUT
          ctx.connect()
        }, ctx.reconnectionTime)
      })
      .on('error', function (err) {
        ctx.onerror(err)
      })
      .on('message', function (message) {
        var event = new Event(jsonrpc.parse(message))

        switch (event.type) {
          case 'invalid':
            return ctx.onerror(event.data)

          case 'notification':
            return ctx.onmessage(event)

          case 'success':
          case 'error':
            ctx.lastId = event.id
            if (ctx.pending[event.id]) {
              ctx.pending[event.id].callback(event.data.error, event.data.result)
            } else {
              ctx.onmessage(event)
            }
            return
          case 'request':
            ctx._respond(event)
            if (event.id !== ctx.lastResponseId) {
              ctx.lastResponseId = event.id
              ctx.onmessage(event)
            }
        }
      })

    return this
  }

  Consumer.prototype.close = function () {
    var ctx = this
    if (!this.connected && !this.connection) return
    this.consumerId = null
    this.connected = false
    if (this.connection) {
      this.connection.off()
      this.connection.once('close', function () {
        ctx.onclose()
      })
      this.connection.close()
      this.connection = null
    } else this.onclose()
  }

  function Event (response) {
    this.type = response.type
    this.data = response.payload
    this.id = this.data.id
  }

  function RpcCommand (pending, method, params, callback) {
    var ctx = this
    this.id = genRpcId()
    this.params = JSON.stringify(jsonrpc.request(this.id, method, params))
    this._callback = callback || noOp

    this.pending = pending
    this.pending[this.id] = this
    this.timer = setTimeout(function () {
      ctx.callback(new Error('Send RPC time out, ' + ctx.id + ', ' + ctx.params))
    }, TIMEOUT)
  }

  RpcCommand.prototype.clear = function () {
    if (!this.pending[this.id]) return false
    clearTimeout(this.timer)
    delete this.pending[this.id]
    return true
  }

  RpcCommand.prototype.callback = function (err, res) {
    if (!this.clear()) return this
    this._callback(err, res)
    return this
  }

  function flushRequest(ctx) {
    if (!ctx.connected) return
    while (ctx.sendQueue.length) ctx.connection.send(ctx.sendQueue.shift().params)
  }

  function flushJoin (ctx) {
    if (!ctx.connected) return
    while (ctx.joinQueue.length) ctx._join(ctx.joinQueue.shift(), ctx.consumerId)
  }

  var count = 0
  function genRpcId () {
    return 'CID:' + (++count)
  }

  function noOp () {}

  return Consumer
}))
