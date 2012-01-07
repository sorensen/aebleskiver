
// Authentication middleware
// -------------------------

// Shim for DNode's current version of socket.io, 
// which cannot pass `null` references, and turning
// the mongoose model to a pure JSON object
function shim(err, doc, fn) {
  if (!err) err = 0
  if (doc) doc = JSON.parse(JSON.stringify(doc))
  return fn(err, doc)
}

module.exports = function(options) {
  var database = options.database
    , Store = options.store

  return function(client, conn) {
    var self = this
      , User = database.model('user')
      , Token = database.model('token')

    this.authenticate = function(data, fn) {
      User.authenticate(data.username, data.password, function(err, doc) {
        if (err || !doc) return shim(err, doc, fn)
        self.session(function(err, sess) {
          if (!err) {
            sess._user = doc._id
            sess.save()
          }
        })
        if (data.remember) {
          var token = new Token({_user: doc._id})
          token.save(function(err) {
            console.log('token: ', err, token.cookieValue)
            if (err) return
            client.cookie('logintoken', JSON.stringify(token.cookieValue), {
              expires: new Date(Date.now() + 2 * 604800000)
            , path: '/'
            }, function(result) {
              console.log('cookie set', result)
            })
          })
        }
        shim(err, doc, fn)
      })
    }

    this.register = function(data, fn) {
      User.register(data, function(err, doc) {
        if (err || !doc) return shim(err, doc, fn)

        self.session(function(err, sess) {
          if (err) return
          sess._user = doc._id
          sess.save()
        })
        if (data.remember) {
          var token = new Token({_user: doc._id})
          token.save(function() {
            client.cookie('logintoken', token.cookieValue, {
              expires: new Date(Date.now() + 2 * 604800000)
            , path: '/'
            }, function(result) {
              console.log('cookie set', result)
            })
          })
        }
        shim(err, doc, fn)
      })
    }

    this.logout = function(fn) {
      self.session(function(err, sess) {
        if (!err) {
          delete sess._user
          sess.save()
        }
        fn && fn()
      })
    }
  }
}
