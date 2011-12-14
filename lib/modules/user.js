
(function(User) {

  // Dependancies
  Message = module('message')

  // Model
  User.Model = Backbone.Model.extend({
      
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
        
    }
    
  , remove: function() {
      this.posts && this.posts.unsubscribe()
    }
  })
  
  // Collection
  User.List = Backbone.Collection.extend({
      
    model: User.Model
  , type: 'user'
  , url: 'users'
  , sync: _.sync
  })

  // Views
  User.Views.Quick = Backbone.View.extend({

    tagName: 'div'
  , className: 'user inactive'
  //, template: _.template($('#user-list-template').html())

  , events: {
      'click': 'activate'
    }

  , initialize: function(options) {
      _.bindAll(this, 'render')
      this.model.bind('change', this.render)
      this.model.bind('remove', this.clear)
      this.model.view = this
      this.render()
    }

  , render: function() {
      return
      var content = this.model.toJSON()
      if (content.username === 'anonymous') {
        content.displayName || (content.displayName = content.username)
        content.username = content.id
      }
      var view = Mustache.to_html(this.template(), content)
      $(this.el).html(view)

      return this
    }

  , remove: function() {
      this.el.remove()
      return this
    }

  , activate: function() {
      $(this.el)
        .addClass('current')
        .removeClass('inactive')
        .siblings()
          .addClass('inactive')
          .removeClass('current')
      
      return this
    }
  })

  User.Views.Details = Backbone.View.extend({

    tagName: 'div'
  , className: 'user-profile'
  , template: _.template($('#user-template').html())

  , events: {
      'keypress .post-form input': 'createPostOnEnter'
    , 'click #post-submit': 'createPost'
    , 'click #leave-profile': 'deactivate'
    , 'click #add-friend' : 'addToFriends'
    , 'click #remove-friend': 'removeFromFriends'
    , 'click #send-message': 'startConversation'
    }

  , initialize: function(options) {
      _.bindAll(this
      ,'statistics'
      , 'allPosts'
      , 'addPost'
      , 'createPost'
      )

      this.model.bind('change', this.statistics)
      this.model.bind('remove', this.remove)

      this.model.posts = new Message.List()
      this.model.posts.url = this.model.url() + ':posts'

      this.model.posts.bind('add',   this.addPost)
      this.model.posts.bind('reset', this.allPosts)
      this.model.posts.bind('add',   this.statistics)

      this.render()

      var self = this
      this.model.posts.subscribe()
      this.model.posts.fetch({
        query: {
          room_id: self.model.get('id')
        }
      , finished: function(data) {
          self.view.loaded()
        }
      })
      return this
    },

    render: function() {
      var content = this.model.toJSON()
        , view = Mustache.to_html(this.template(), content)

      $(this.el)
        .html(view)
        .find('[title]')
        .wijtooltip()

      this.input = this.$('.create-post')
      this.postList = this.$('.posts')
      this.input.focus()
    },

    remove: function() {
      this.model && this.model.remove()
      $(this.el).remove()
    },

    statistics: function() {
      var totalPosts = this.model.posts.length
      this.$('.user-stats').html(Mustache.to_html(this.statsTemplate(), {
        totalPosts: totalPosts
      }))
      return this
    },

    activate: function() {
      $(this.el)
        .addClass('current')
        .removeClass('inactive')
        .siblings()
          .addClass('inactive')
          .removeClass('current')
    },

    deactivate: function() {
      this.view.router.navigate('/', true)
      this.view.deactivateUser(this.model)
    },

    allPosts: function(posts) {
      this.postList.html('')
      this.model.posts.each(this.addPost)
    },

    addPost: function(post) {
      var view = new Message.Views.Details({
        model: post
      }).render()

      this.postList
        .append(view.el)
        .scrollTop(this.postList[0].scrollHeight)
    },

    createPost: function() {
      if (!this.input.val()) return
      this.model.posts.create(this.newAttributes())
      this.input.val('')
    },

    createPostOnEnter: function(e) {
      if (e.keyCode == 13) this.createPost()
    },

    newAttributes: function() {
      var username = user.get('username')
        , displayName = user.get('displayName') || user.get('username')
        , id = user.get('id') || user.id

      return {
        text: this.input.val()
      , room_id: this.model.get('id')
      , user_id: id
      , username: username
      , displayName: displayName
      , avatar: user.get('avatar')
      }
    }
  })

})(module('user'))
