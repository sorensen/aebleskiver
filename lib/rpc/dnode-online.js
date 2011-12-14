
var cache = []

module.exports = function(options) {
  var redis = options.database
    , prefix = (options.prefix || 'online:')
    , remove = (options.remove = true)
    , offset = (options.offset = 60000 * 60 * 24)
    , interval = (options.interval = 60000 * 10)

  if (!redis) throw new Error('redis connection required')

  function clearOld(key, opt, fn) {
    console.log('clearing online')
    if (!cache.length) return
    
    opt || (opt = {})
    if ('function' === typeof opt) {
      fn = opt
      opt = {}
    }
    opt.min || (opt.min = '-inf')
    opt.max || (opt.max = new Date().getTime() - offset)
    console.log('zremrange: ', key, opt)

    cache.forEach(function (x) {
      console.log('cache: ', x)
      redis.zremrangebyscore(prefix + x, opt.min, opt.max, function(err, resp) {
        console.log('zremrange done: ', err, resp)
          if ('function' !== typeof fn) return
          fn(err, resp)
      })
    })
  }

  if (remove) {
    setInterval(clearOld, interval)
  }

  return function(client, con) {

    this.clearOld = clearOld

    this.online = function(key, opt, fn) {
      console.log('online: ', key, opt)
      opt || (opt = {})
      if ('function' === typeof opt) {
        fn = opt
        opt = {}
      }
      if ('function' !== typeof fn || !key) return
      opt.min || (opt.min = '-inf')
      opt.max || (opt.max = '+inf')
      redis.zrangebyscore(prefix + key, opt.min, opt.max, function(err, resp) {
        console.log('onlined: ', err, resp)
        fn(err, resp)
      })
    }

    this.join = function(key, val, fn) {
      console.log('join: ', key, val, new Date().getTime())
      if ('string' !== typeof key) return
      if ('string' !== typeof val) return
    
      !~cache.indexOf(key) && cache.push(key)
      redis.zadd(prefix + key, new Date().getTime(), val, function(err, resp) {
        console.log('joined: ', err, resp)
        if ('function' !== typeof fn) return
        fn(err, resp)
      })
    }

    this.leave = function(key, val, fn) {
      console.log('leave: ', key, val)
      if ('string' !== typeof key) return
      if ('string' !== typeof val) return
      redis.zrem(prefix + key, val, function(err, resp) {
        console.log('leaved: ', err, resp)
        if ('function' !== typeof fn) return
        fn(err, resp)
      })
    }
  }
}
