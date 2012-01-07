
(function(Room) {

  // Dependencies
  var Message = module('message')

  // Model
  Room.Model = Backbone.Model.extend({
  
    type: 'room'
  , sync: _.sync
  , idAttribute: '_id'

  , defaults: {
      name: 'Unknown'
    , messages: []
    , upvotes: 0
    , downvotes: 0
    , rank: 0
    }
  })

  // Collection
  Room.List = Backbone.Collection.extend({
    
    model: Room.Model
  , url: 'rooms'
  , type: 'room'
  , sync: _.sync
  , idAttribute: '_id'

  , comparator: function(room) {
      var now = new Date().getTime()
        , then = new Date(room.get('created')).getTime()
        , comparison = (now - then) / 500000

      return room.get('downvotes') - room.get('upvotes') + comparison
    }
  })

  // Views
  Room.Views.Quick = Backbone.View.extend({

    tagName: 'div'
  , className: 'room inactive'
  , template: _.template($('#room-list-template').html())

  , events: {
    //   'click .upvote': 'upVote'
    // , 'click .downvote': 'downVote'
      'click .navigate': 'navigation'
    }

  , initialize: function(options) {
      _.bindAll(this
      , 'render'
      , 'remove'
      , 'statistics'
      , 'navigation'
      )
      this.view = options.view
      this.model.bind('change', this.statistics)
      this.model.bind('remove', this.remove)
      this.loaded = 0
    }

  , navigation: function(e) {
      this.activate()
      this.view.router.navigate('rooms/' + this.model.get('slug'), true)
      e.preventDefault()
    }

  , render: function() {
      var content = this.model.toJSON()
      content.name = this.model.escape('name')
      content.description = this.model.escape('description')

      var view = Mustache.to_html(this.template(), content)
      $(this.el).html(view)
      this.statistics()

      return this
    }

  , statistics: function() {
      return
      var rank = this.model.get('upvotes') - this.model.get('downvotes')
        , view = Mustache.to_html(this.rankTemplate(), {
            rank: rank
          })

      this.$('.ranking').html(view)
      return this
    }

  , remove: function() {
      $(this.el).remove()
      return this
    }

  , activate: function() {
      $(this.el)
        .addClass('active')
        .removeClass('inactive')
        .siblings()
        .addClass('inactive')
        .removeClass('active')
      
      return this
    }

  , leave: function() {
        $(this.el)
          .removeClass('active')
          .addClass('inactive')
      
      return this
    }
  })

  Room.Views.Details = Backbone.View.extend({

    tagName: 'div'
  , className: 'main-room'
  , template: _.template($('#room-template').html())

  , events: {
      'keypress .message-form input': 'createMessageOnEnter'
    , 'click #message-submit': 'createMessage'
    , 'click #leave-room': 'leave'
    , 'click .delete-room': 'deleteRoom'
    }

  , initialize: function(options) {
      _.bindAll(this
      , 'allMessages'
      , 'addMessage'
      , 'createMessage'
      , 'render'
      , 'remove'
      , 'statistics'
      )
      this.view = options.view
      this.model.bind('change', this.statistics)
      this.model.bind('remove', this.remove)

      this.model.messages = new Message.List()
      this.model.messages.url = this.model.url() + ':messages'

      this.model.messages.bind('add', this.addMessage)
      this.model.messages.bind('reset', this.allMessages)
      this.model.messages.bind('add', this.statistics)

      this.render()

      var self = this
      this.model.messages.subscribe()

      if (bootstrap.messages && bootstrap.messages[this.model.id]) {
        this.model.messages.reset(bootstrap.messages[this.model.id])
        this.view.loaded()
      } else {
        this.model.messages.fetch({
          query: {
            _room: self.model.id
          }
        , sorting: {
            sort: [['created', -1]]
          , limit: 1000
          }
        , success: function(data) {
            self.view.loaded()
          }
        })
      }
    }

  , render: function() {
      var content = this.model.toJSON()
        , self = this

      // Pre-formatting to prevent XSS
      content.name = this.model.escape('name')
      content.description = this.model.escape('description')

      var view = Mustache.to_html(this.template(), content)
      $(this.el)
        .html(view)
        .find('[title]')
        .wijtooltip()

      // Set shortcut methods for DOM items
      this.title = this.$('.headline')
      this.controls = this.$('.controls')
      this.description = this.$('.description')
      this.input = this.$('.create-message')
      this.messageList = this.$('.messages')

      // Post-formatting, done here as to prevent conflict
      // with Mustache HTML entity escapement
      this.title.html(_.linkify(self.model.escape('name')))
      this.description.html(_.linkify(self.model.escape('description')))
      this.input.focus()
      return this
    }

  , remove: function() {
      this.model.messages.unsubscribe()
      $(this.el).remove()
      return this
    }

  , statistics: function() {
      return
      var totalMessages = this.model.messages.length
      this.$('.room-stats').html(Mustache.to_html(this.statsTemplate(), {
        totalMessages: totalMessages
      }))
      return this
    }

  , deleteRoom: function() {
      this.model.destroy()
      return this
    }

  , leave: function() {
      this.view.router.navigate('/', true)
      this.view.deactivateRoom(this.model)
      return this
    }

  , allMessages: function(messages) {
      this.messageList.html('')
      this.model.messages.each(this.addMessage)
      this.statistics()
      this.messageList
        .delay(400)
        .stop()
        .scrollTop(this.messageList[0].scrollHeight)

      return this
    }

  , addMessage: function(message) {
      var view = new Message.Views.Details({
        model: message
      }).render()

      this.messageList.append(view.el)

      var position = this.messageList.height() + this.messageList.scrollTop()
        , buffer = 300
        , height = this.messageList[0].scrollHeight

      // Check to see if the user is at the bottom of the list,
      // before scrolling, allowing them to read old msg's
      if (position + buffer >= height) {
        this.messageList
          .stop()
          .animate({scrollTop: height}, 200, 'easeInExpo')
      }
      return this
    }

  , createMessage: function() {
      if (!this.input.val()) return
      this.model.messages.create(this.newAttributes())
      this.input.val('')
      return this
    }

  , createMessageOnEnter: function(e) {
      if (e.keyCode == 13) this.createMessage()
      return this
    }

  , newAttributes: function() {
      var username = this.view.client.get('username')
        , id = this.view.client.id || null
      
      return {
        text: this.input.val()
      , _room: this.model.id
      , _user: id
      , username: username
      }
    }
  })

})(module('room'))
