
(function(Message) {

  // Model
  Message.Model = Backbone.Model.extend({

    type: 'message'
  , sync: _.sync
  , idAttribute: '_id'

  , defaults: {
      text : ''
    , username: ''
    , avatar: ''
    }

  , clear: function() {
      this.view.remove()
    }
  })

  // Collection
  Message.List = Backbone.Collection.extend({

    model: Message.Model
  , url: 'messages'
  , type: 'message'
  , sync: _.sync
  , idAttribute: '_id'

  , comparator: function(message) {
      return new Date(message.get('created')).getTime()
    }
  })

  // Views
  Message.Views.Details = Backbone.View.extend({

    // DOM attributes
    tagName: 'li'
  , className: 'message'
  , template: _.template($('#message-template').html())

  , initialize: function(options) {
      _.bindAll(this, 'render')
      this.model.bind('change', this.render)
      this.model.view = this
    }
    
  , remove: function() {
      $(this.el).remove()
    }

  , render: function() {
      var content = this.model.toJSON()
      
      // Switch name and ID for an anonymous user, they can only be 
      // looked up via session id, instead of username
      if (content.username === 'anonymous') {
        content.displayName || (content.displayName = content.username)
        content.username = content.user_id
      }
      
      // Pre-formatting 
      content.text = this.model.escape('text')
      content.created && (content.created = _.timeFormat(content.created))
      
      var view = Mustache.to_html(this.template(), content)
      $(this.el).html(view)
      
      this.model.concurrent && $(this.el).addClass('concurrent')
      
      this.$('.data')
        .html(_.linkify(content.text))
        .emoticonize({
          animate: false
        })
      
      return this
    }
  })

})(module('message'))
