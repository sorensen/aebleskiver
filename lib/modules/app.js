
(function(App) {

  // Dependencies
  var Room = module('room')
    , Client = module('client')
    , User = module('user')

  // Router
  App.Router = Backbone.Router.extend({
    
    routes: {
      'rooms/:slug': 'joinRoom'
    , '/rooms/:slug': 'joinRoom'
    , 'profiles/:slug': 'viewProfile'
    , '/profiles/:slug': 'viewProfile'
    , '': 'home'
    , '/': 'home'
    , '*uri': 'invalid'
    }
    
  , initialize: function(options) {
      this.server = options.server
      this.view = new App.Views.Main({
        el: $('#application')
      , url: 'aebleskiver'
      , server: options.server
      })
      this.view.router = this
    }
    
  , home: function() {
      this.view.home()
    }
    
  , joinRoom: function(slug) {
      this.view.activateRoom(slug)
    }
    
  , invalid: function(uri) {
      this.navigate('/', true)
    }
  })

  // Main view
  App.Views.Main = Backbone.View.extend({
   
    template: _.template($('#application-template').html())
  , createRoomTemplate: _.template($('#create-room-template').html())
  , statsTemplate: _.template($('#application-stats-template').html())
  , loginTemplate: _.template($('#login-template').html())
  , signupTemplate: _.template($('#signup-template').html())
  , settingsTemplate: _.template($('#settings-template').html())
  , notificationTemplate: _.template($('#notification-template').html())
  
  , events: {
      'click #home': 'goHome'
    , 'keyup': 'hideOnEscape'
    , 'click #show-rooms': 'showRooms'
    , 'click .cancel': 'hideDialogs'
    , 'click #overlay': 'hideDialogs'

    , 'click #create-room': 'showCreateRoom'
    , 'click #create-room-form .submit': 'createRoom'
    , 'keypress #create-room-form input': 'createRoomOnEnter'

    , 'click #login': 'showLogin'
    , 'click #login-form .submit': 'authenticate'
    , 'keypress #login-form input': 'authenticateOnEnter'
    , 'click #logout': 'logout'
    
    , 'click #settings': 'showSettings'
    , 'click #settings-form .submit': 'saveSettings'
    , 'keypress #settings-form input': 'saveSettingsOnEnter'
    
    , 'click #signup': 'showSignup'
    , 'click #signup-form .submit': 'register'
    , 'keypress #signup-form input': 'registerOnEnter'
    
    , 'keypress #search': 'searchOnEnter'
    , 'click #search-now': 'searchOnEnter'
    }
  
  , initialize: function(options) {
      _.bindAll(this
      , 'goHome'
      , 'render'
      , 'loading'
      , 'loaded'
      , 'addRoom'
      , 'showCreateRoom'
      , 'createRoom'
      , 'allRooms'
      , 'addUser'
      , 'allUsers'
      , 'authenticate'
      , 'register'
      , 'logout'
      )
      var self = this
      this.server = options.server

      // Rooms
      this.rooms = new Room.List()
      this.rooms.url = this.url + ':rooms'
      this.rooms.bind('add', this.addRoom)
      this.rooms.bind('change', this.statistics)
      this.rooms.bind('reset', this.allRooms)

      // Client
      this.client = new Client.Model({
        server: options.server
      })
      if (!_.isEmpty(user)) {
        this.client.set(user)
        this.client.loggedIn = true
      }
      
      options.server.session(function(err, sess) {
        self.session = sess
      })

      // Default spinner settings
      this.spinnerOpts = {
        lines: 12
      , length: 17
      , width: 7
      , radius: 18
      , color: '#fff'
      , speed: 0.8
      , trail: 60
      , shadow: true
      }

      // Default notification settings
      this.meowOpts = {
        message: ''
      , title: 'Notice'
      , duration: 20000
      , closeable: false
      }

      this.render()
      this.rooms.subscribe()

      if (bootstrap.rooms) {
        this.rooms.reset(bootstrap.rooms)
        this.history()
      } else {
        this.rooms.fetch({
          query: {}
        , success: function(resp) {
            self.history()
          }
        })
      }

      _.delay(function() {
        self.history()
      }, 5000)
    }
  
  , render: function() {
      this.el.html(Mustache.to_html(this.template()))

      // DOM bindings
      this.searchInput = this.$('#search')
      this.roomList = this.$('#rooms')
      this.userList = this.$('#users')
      this.sidebar = this.$('#sidebar')
      this.mainContent = this.$('#main-content')
      this.overlay = this.$('#overlay')
      this.roomName = this.$('input[name="room"]')
      this.outerSpinner = this.$('#spinner')
      this.innerSpinner = this.$('#inner-spinner')
      this.splash = this.$('#splash')

      // Dialogs
      this.createRoomDialog = this.$('#create-room-dialog')
      this.loginDialog = this.$('#login-dialog')
      this.signupDialog = this.$('#signup-dialog')
      this.createRoomDialog = this.$('#create-room-dialog')
      this.settingsDialog = this.$('#settings-dialog')

      this.spinner = new Spinner(this.spinnerOpts)
      this.isLoading = false
      this.loading()
      return this
    }
  
  , hideOnEscape: function(e) {
      if (e.keyCode == 27) {
        this.hideDialogs()
        this.loaded()
      }
      return this
    }

  , hideDialogs: function() {
      this.$('.dialog').fadeOut(300)
      this.overlay.hide(300)
      return this
    }

  , history: _.once(function() {
      var self = this
      return _.defer(function() {
        Backbone.history.start({
          pushState: true
        })
        self.loaded()
      })
    })

  , goHome: function(e) {
      this.router.navigate('/', true)
      e.preventDefault()
    }
  
  , home: function() {
      this.isHome = true
      this.deactivateRoom()
      this.el.addClass('home')
      this.splash.show()
      return this
    }

  , notHome: function() {
      if (this.isHome) {
        this.el.removeClass('home')
        this.splash.hide()
        this.isHome = false
      }
      return this
    }
  
  , loading: function() {
      var self = this
      if (!this.isLoading) {
        this.outerSpinner.fadeIn(50)
        this.spinner.spin(self.innerSpinner.get(0))
        this.isLoading = true
      }
      return this
    }

  , loaded: function() {
      var self = this
      if (this.isLoading) {
        _.defer(function() {
            self.spinner.stop()
            self.outerSpinner.fadeOut(200)
            self.isLoading = false
        })
      }
      return this
    }

    // Room methods
    // ------------

  , allRooms: function(rooms) {
      this.roomList.html('')
      this.rooms.each(this.addRoom)
      return this
    }

  , showRooms: function() {
      this.userList.fadeOut(150)
      this.roomList.fadeIn(150)
      return this
    }

  , addRoom: function(room) {
      var view = new Room.Views.Quick({
        model: room
      , view: this
      }).render()

      this.roomList.append(view.el)
      return this
    }

  , deactivateRoom: function() {
      if (this.activeRoom) {
        this.mainContent
          .hide()
          .html('')

        this.activeRoom.remove()
      }
      return this
    }

  , activateRoom: function(params) {
      this.deactivateRoom()

      var self = this
        , model = this.rooms.filter(function(room) {
          return room.get('slug') === params
        })

      if (!model || !model[0]) {
        this.router.navigate('/', true)
      } else {
        this.loading()
        this.activeRoom = new Room.Views.Details({
          model: model[0]
        , view: this
        })
        this.activeRoom.view = this

        this.mainContent
          .html(self.activeRoom.el)
          .fadeIn(50)
          .show()
      }
      return this
    }

  , createRoom: function() {
      this.loading()

      var name = this.$('input[name="room"]')
        , restricted = this.$('input[name="restricted"]')
        , description = this.$('textarea[name="description"]')
        , self = this
      
      this.rooms.create({
        name: name.val(),
        _user: this.client.id || null,
        restricted: restricted.val(),
        description: description.val()
      }, {
        finished: function(resp) {
          _.defer(function() {
            self.loaded()
            self.router.navigate('/rooms/' + resp.slug, true)
          })
        }
      })

      this.createRoomDialog.fadeOut(150)
      this.overlay.hide()

      // Reset fields
      name.val('')
      restricted.val('')
      description.val('')
      return this
    }

  , createRoomOnEnter: function(e) {
      if (e.keyCode == 13) this.createRoom()
      return this
    }

  , showCreateRoom: function() {
      var self = this

      this.hideDialogs()
      this.overlay.fadeIn(150)

      this.createRoomDialog
        .html(Mustache.to_html(this.createRoomTemplate()))
        .fadeIn(150, function() {
          self.$('#create-room-form').isHappy({
            fields: {
              '#create-room-name': {
                required: true
              , message: 'Please name this room'
              },
              '#create-room-description': {
                required: false
              , message: 'Give some info about this room'
              }
            }
          , submitButton: '#create-room-submit'
          , unHappy: function() {
              //TODO: real notification
              alert('Create room is unhappy.:(')
            }
          })
        })
        .draggable()
        .find('input[name="room"]').focus()
      
      return this
    }

  , searchOnEnter: _.debounce(function() {
      var self = this
        , input = this.searchInput.val()
        , query = (input.length < 1) ? {}: {
            keywords: { $in: [ input ] }
          }
      
      this.model.rooms.fetch({
        query: query
      })
        
    }, 1000)

    // User methods
    // ------------
    
  , showUsers: function() {
      this.roomList.fadeOut(150)
      this.userList.fadeIn(150)
      return this
    }
    
  , allUsers: function(users) {
      this.userList.html('')
      this.model.users.each(this.addUser)
    }
    
  , addUser: function(user) {
      var view = new User.Views.Quick({
        model: user
      , view: this
      }).render()
      
      this.userList.append(view.el)
    }

  , deactivateUser: function() {
      if (this.activeUser) {
        this.mainContent.html('')
        this.activeUser.remove()
      }
    }
    
  , activateUser: function(params) {
      this.deactivateUser()
      
      var model = this.model.users.filter(function(user) {
        return user.get('username') === params
          || user.get('_id') === params
      })

      if (!model || !model[0]) {
        this.router.navigate('/', true)
        return this
      }

      this.loading()
      this.activeUser = new User.Views.Details({
        model: model[0]
      , view: this
      })
      
      this.activeUser.view = this

      var self = this
      this.mainContent
        .stop()
        .html(self.activeUser.el)
        .fadeIn(50)
      
      return this
    }
    
    // Authentication methods
    // ----------------------

  , showSettings: function() {
      var self = this
      this.hideDialogs()
      this.overlay.fadeIn(150)
      this.settingsDialog
        .html(Mustache.to_html(this.settingsTemplate(), self.client.toJSON()))
        .fadeIn(150, function() {
          self.$('#settings-form').isHappy({
            fields: {
              '#settings-username': {
                required: true
              , message: 'What should we call you?'
              }
            , '#settings-email': {
                required: true
              , message: 'Email is required'
              , test: happy.email
              }
            }
          , submitButton: '#settings-submit'
          , unHappy: function() {
              alert('Settings are unhappy.:(')
            }
          })
        })
        .draggable()
        .find('input[name="displayname"]').focus()
      
      return this
    }
    
  , saveSettings: function() {
      var self = this
        , data = {
            bio: this.$('textarea[name="bio"]').val()
          , email: this.$('input[name="email"]').val()
          , password: this.$('input[name="password"]').val()
          , displayName: this.$('input[name="displayname"]').val()
          }
      
      self.client.save(data, {channel: 'aebleskiver:users'})
      this.settingsDialog.fadeOut(150)
      this.overlay.hide()
      return this
    }
    
  , saveSettingsOnEnter: function(e) {
      if (e.keyCode == 13) this.saveSettings()
      return this
    }
    
  , showLogin: function() {
      this.hideDialogs()
      this.overlay.fadeIn(150)
      this.loginDialog
        .html(Mustache.to_html(this.loginTemplate()))
        .fadeIn(150, function() {
          self.$('#login-form').isHappy({
            fields: {
              '#login-username': {
                required: true
              , message: 'Who are you again?'
              }
            , '#login-password': {
                required: true
              , message: 'Password please'
              }
            }
          , submitButton: '#login-submit'
          , unHappy: function() {
              alert('Login is unhappy.:(')
            }
          })
        })
        .draggable()
        .find('input[name="username"]').focus()
    }
    
  , authenticate: function() {
      var self = this
        , data = {
            username: this.$('#login-username').val()
          , password: this.$('#login-password').val()
          }
      
      this.client.authenticate(data, function(err, resp) {
        if (err) {
          $.meow(_.defaults({
            title: 'Error'
          , message: err
          }, self.meowOpts))
          return new Error(err)
        }
        $.meow(_.defaults({
          title: 'Success'
        , message: 'Authentication complete'
        }, self.meowOpts))
        self.hideDialogs()
      })
    }
    
  , authenticateOnEnter: function(e) {
      if (e.keyCode == 13) this.authenticate()
    }
    
  , showSignup: function() {
      var self = this
      this.hideDialogs()
      this.overlay.fadeIn(150)
      this.signupDialog
        .html(Mustache.to_html(this.signupTemplate()))
        .fadeIn(150, function(){
          self.$('#signup-form').isHappy({
            fields: {
              '#signup-username': {
                required: true
              , message: 'What should we call you?'
              }
            , '#signup-email': {
                required: false
              , message: 'Invalid email address'
              , test: happy.email
              }
            , '#signup-password': {
                required: true
              , message: 'Password required'
              , test: happy.minLength(4)
              }
            }
          , submitButton: '#signup-submit'
          , unHappy: function() {
              alert('Signup is unhappy.:(')
            }
          })
        })
        .draggable()
        .find('input[name="username"]').focus()
    }
    
  , register: function() {
      var self = this
        , data = {
            username: this.$('#signup-username').val()
          , email: this.$('#signup-email').val()
          , password: this.$('#signup-password').val()
          }
      
      this.client.register(data, function(err, resp) {
        if (err) {
          $.meow(_.defaults({
            title: 'Error'
          , message: err
          }, self.meowOpts))
          return new Error(err)
        }
        $.meow(_.defaults({
          title: 'Successfull'
        , message: 'Registration complete'
        }, self.meowOpts))
        self.hideDialogs()
      })
    }
    
  , registerOnEnter: function(e) {
      if (e.keyCode == 13) this.register()
    }
    
  , logout: function() {
      this.client.logout()
    }
  })

})(module('app'))
