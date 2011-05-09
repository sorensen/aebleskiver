(function(Views) {
    // Room room views
    // -----------------
    
    // Both the simple 'Room' view and the full 'MainRoom'
    // view share the same room model, with the main difference
    // being that the 'Room' view does not hold a message
    // collection, and provides different updates
    
    // Room room
    Views.RoomView = Backbone.View.extend({
    
        // DOM attributes
        tagName        : 'div',
        className      : 'room inactive',
        template       : _.template($('#room-list-template').html()),
        rankTemplate   : _.template($('#room-rank-template').html()),
        
        // Interaction events
        events : {
            "click"           : "activate",
            "click .upvote"   : "upVote",
            "click .downvote" : "downVote"
        },
        
        // Constructor
        initialize : function(options) {
            // Bind to model
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
            this.model.view = this;
            
            // Send model contents to the template
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);            
            $(this.el).html(view);
            
            this.render();
        },
        
        // Refresh statistics
        render : function() {
            var rank = this.model.get('upvotes') - this.model.get('downvotes');
            this.$('.ranking').html(Mustache.to_html(this.rankTemplate(), {
                rank : rank
            }));
            return this;
        },
        
        // Remove this view from the DOM.
        remove : function() {
            this.el.remove();
        },
        
        // Increment the room ranking
        upVote : _.throttle(function() {
            this.model.save({upvotes : this.model.get('upvotes') + 1});
            this.model.collection.sort();
        }, 0),
        
        // Decrement the room ranking
        downVote : _.throttle(function() {
            this.model.save({downvotes : this.model.get('downvotes') + 1});
            this.model.collection.sort();
        }, 0),
        
        // Join Channel
        activate : function() {            
            $(this.el)
                .addClass('current')
                .removeClass('inactive')
                .siblings()
                .addClass('inactive')
                .removeClass('current');
        },
    });
    
    // Room room
    Views.RoomMainView = Backbone.View.extend({
    
        // DOM attributes
        tagName        : 'div',
        className      : 'main-room',
        template       : _.template($('#room-template').html()),
        statsTemplate  : _.template($('#room-stats-template').html()),
        
        // Interaction events
        events    : {
            "keypress .message-form input" : "createMessageOnEnter",
            "click .message-form button"   : "createMessage",
            "click .destroy"               : "deactivate"
        },
        
        // Constructor
        initialize : function(options) {
            _.bindAll(this, 
                'allMessages', 'addMessage', 'createMessage', 'render'
            );
            
            // Bind to model
            this.model.view = this;
            this.model.bind('change', this.render);
            
            this.model.messages = new Models.MessageCollection();
            this.model.messages.url = this.model.url() + ':messages';
            
            this.model.messages.bind('add', this.addMessage);
            this.model.messages.bind('refresh', this.allMessages);
            this.model.messages.bind('add', this.render);
            
            // Send model contents to the template
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);            
            $(this.el).html(view);
            
            // Set shortcut methods for DOM items
            this.input       = this.$(".create-message");
            this.messageList = this.$(".messages");
            this.input.focus();
            
            var self = this;
            this.model.messages.subscribe({}, function() {
            
                var params = {
                    query    : {room : self.model.get('_id')},
                    finished : function(data) {
                    },
                };
                self.model.messages.fetch(params);
            });
        },
        
        // Refresh statistics
        render : function() {
            var totalMessages = this.model.messages.length;
            this.$('.room-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalMessages : totalMessages
            }));
            return this;
        },
        
        // Tell the application to remove this room
        deactivate : function() {
            //TODO: Move to the controller or 
            // affect the display only
            Application.deactivateRoom(this.model);
            Backbone.history.saveLocation('/');
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            this.model.remove();
        },
        
        // All rooms have been loaded into collection
        allMessages : function(messages) {
            console.log('allMessages', messages);
            console.log('allMessages', this);
            
            this.messageList.html('');
            this.model.messages.each(this.addMessage);
            
            // Refresh model statistics
            this.render();
        },
        
        addMessage : function(message) {
            console.log('addMessage', message);
            var view = new Views.MessageView({
                model : message
            }).render();
            
            this.messageList
                .append(view.el)
                .scrollTop(this.messageList[0].scrollHeight);
        },
        
        // Send a message to the server
        createMessage : function() {
            if (!this.input.val()) return;
            this.model.messages.create(this.newAttributes());
            this.input.val('');
        },
        
        // Create message keystroke listener
        createMessageOnEnter : function(e) {
            if (e.keyCode == 13) this.createMessage();
        },
        
        // Generate the attributes
        newAttributes : function() {
            return {
                text     : this.input.val(),
                room     : this.model.escape('_id'),
                user     : window.user.escape('_id'),
                username : window.user.escape('displayName') || window.user.get('username'),
                avatar   : window.user.escape('avatar')
            };
        },
    });
    
})(Views)