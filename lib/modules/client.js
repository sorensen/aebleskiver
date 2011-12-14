
(function(Client) {

  // Model
  Client.Model = Backbone.Model.extend({

    type: 'user'
  , sync: _.sync
    
  , defaults: {
      username: 'anonymous'
    , first_name: ''
    , last_name: ''
    , email: ''
    , avatar: '/images/undefined.png'
    , status: 'offline'
    , email: ''
    , created: ''
    , modified: ''
    , bio: ''
    , friends: []
    , images: []
    , favorites: []
    , password: ''
    , visits: 0
    }
    
  , initialize: function(options) {
      _.bindAll(this
      , 'logout'
      , 'authenticate'
      , 'register'
      )
      this.server = options.server
      this.loggedIn = false
    }

  , logout: function(next) {
      var self = this
      this.server.logout(function() {
        self.clear()
        self.set(self.defaults)
        self.loggedIn = false
        self.trigger('logout')
        next && next()
      })
    }
    
  , authenticate: function(data, next) {
      var self = this
      this.server.authenticate(data, function(err, resp) {
        console.log('authenticated: ', err, resp)
        if (err) return next(err, null)
        self.set(resp)
        console.log('set: ', self)
        self.loggedIn = true
        next && next(null, resp)
      })
    }
    
  , register: function(data, next) {
      var self = this
      this.server.register(data, function(err, resp) {
        console.log('c reg', resp)
        if (err) return next(err, null)
        self.set(resp)
        self.loggedIn = true
        next && next(err, resp)
      })
    }
  })

})(module('client'))
