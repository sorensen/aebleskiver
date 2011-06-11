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
            //'click'           : 'activate',
            'click .upvote'   : 'upVote',
            'click .downvote' : 'downVote'
        },
        
        // Constructor
        initialize : function(options) {
            // Bind to model
            _.bindAll(this, 'render', 'highlight', 'remove');
            
            this.model.view = this;
            this.model.bind('change', this.render);
            this.model.bind('remove', this.remove);
            
            // Send model contents to the template
            var content = this.model.toJSON();
            console.log('before content', content);
            // Pre-rendering formatting to prevent XSS
            content.name = this.model.escape('name');
            content.description = this.model.escape('description');
            console.log('after content', content);
            
            var view = Mustache.to_html(this.template(), content);            
            $(this.el)
                .html(view)
                .find('[title]')
                .wijtooltip();
            
            this.loaded = 0;
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
        
        highlight : _.debounce(function() {
            if (this.loaded) {
                $(this.el).effect('highlight', {
                    color : '#5d5d5d'
                }, 1200);
            }
            this.loaded = 1;
        }, 1200),
        
        // Remove this view from the DOM.
        remove : function() {
            $(this.el).remove();
        },
        
        // Increment the room ranking
        upVote : _.debounce(function() {
            this.model.save({upvotes : this.model.get('upvotes') + 1});
            this.model.collection.sort();
        }, 500),
        
        // Decrement the room ranking
        downVote : _.debounce(function() {
            this.model.save({downvotes : this.model.get('downvotes') + 1});
            this.model.collection.sort();
        }, 500),
        
        // Join Channel
        activate : function() {            
            $(this.el)
                .addClass('active')
                .addClass('current')
                .removeClass('inactive')
                .siblings()
                .addClass('inactive')
                .removeClass('current');
        },
        
        // Leave Channel
        deactivate : function() {            
            $(this.el)
                .removeClass('active')
                .removeClass('current')
                .addClass('inactive');
        },
    });
    
    // Room room
    Views.RoomMainView = Backbone.View.extend({
    
        // DOM attributes
        tagName        : 'div',
        className      : 'main-room',
        template       : _.template($('#room-template').html()),
        statsTemplate  : _.template($('#room-stats-template').html()),
        
        lastPoster : '',
        
        // Interaction events
        events    : {
            'keypress .message-form input' : 'createMessageOnEnter',
            'click .message-form button'   : 'createMessage',
            'click .destroy'               : 'deactivate',
            'click .add-favorite'          : 'addToFavorites',
            'click .remove-favorite'       : 'removeFromFavorites',
            'click .delete-room'           : 'deleteRoom',
        },
        
        // Constructor
        initialize : function(options) {
            this.viewable = this.model.allowedToView(window.user);
            if (!this.viewable) {
                return;
            }
            
            _.bindAll(this, 
                'allMessages', 'addMessage', 'createMessage', 'render',
                'remove'
            );
            
            // Bind to model
            this.model.mainView = this;
            this.model.bind('change', this.render);
            this.model.bind('remove', this.remove);
            
            this.model.messages = new Models.MessageCollection();
            this.model.messages.url = Helpers.getUrl(this.model) + ':messages';
            
            this.model.messages.bind('add', this.addMessage);
            this.model.messages.bind('refresh', this.allMessages);
            this.model.messages.bind('add', this.render);
            
            // Send model contents to the template
            var content = this.model.toJSON(),
                self    = this;
            
            // Pre-formatting to prevent XSS
            content.name = this.model.escape('name');
            content.description = this.model.escape('description');
            
            var view = Mustache.to_html(this.template(), content);            
            $(this.el)
                .html(view)
                .find('[title]')
                .wijtooltip();
            
            this.editable = this.model.allowedToEdit(window.user);
            // Check if the current user is the room creator
            if (this.editable) {
                $(this.el).addClass('editable');
            } else {
                this.$('.admin-controls').remove();
            }
            
            // Set shortcut methods for DOM items
            this.title       = this.$('.headline');
            this.controls    = this.$('.controls');
            this.description = this.$('.description');
            this.input       = this.$('.create-message');
            this.messageList = this.$('.messages');
            
            // Post-formatting, done here as to prevent conflict
            // with Mustache HTML entity escapement
            this.title.html(Helpers.linkify(self.model.escape('name')));
            this.description.html(Helpers.linkify(self.model.escape('description')));
            
            this.model.messages.subscribe({}, function() {
                self.model.messages.fetch({
                    query    : {room_id : self.model.get('id')},
                    sorting  : {sort: [['created',-1]], limit: 20},
                    finished : function(data) {
                    },
                });
            });
            
            this.input.focus();
        },
        
        deleteRoom : function() {
            this.model.destroy();
        },
        
        addToFavorites : function() {
            if (this.model.get('id') == window.user.get('id')
                || this.model.get('id') == window.user.id) {
                return;
            }
            
            var favorites = window.user.get('favorites') || [];            
            var find = _.indexOf(favorites, this.model.get('id'));
            
            if (find !== -1) {
                return;
            }
            favorites.push(this.model.get('id'));
            
            window.user.set({
                favorites : _.unique(favorites)
            }).save();
            
            window.user.favorites.add(this.model);
        },
        
        removeFromFavorites : function() {
            var id = this.model.get('id');
            var favorites = _.without(window.user.get('favorites'), id);
            
            var person = window.user.favorites.get(id);
            $(person.view.el).remove();
            
            window.user.favorites.remove(this.model, {
                silent : true
            });
            window.user.set({
                favorites : favorites
            }).save();
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
            Backbone.history.saveLocation('/');
            Application.deactivateRoom(this.model);
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            this.model.view && this.model.view.deactivate();
            this.model && this.model.remove();
            this.model.messages.unsubscribe();
            $(this.el).remove();
        },
        
        concurrency : function(message) {
            message.concurrent = (message.get('user_id') === this.lastPoster) ? true : false;
            this.lastPoster = message.get('user_id');
        },
        
        // All rooms have been loaded into collection
        allMessages : function(messages) {
            this.messageList.html('');
            //this.model.messages.each(this.concurrency);
            this.model.messages.each(this.addMessage);
            this.render()
                .messageList
                .delay(400)
                .animate({scrollTop : this.messageList[0].scrollHeight}, 1000, 'easeInExpo');
                //.scrollTop(this.messageList[0].scrollHeight);
        },
        
        addMessage : function(message) {
            //this.concurrency(message);
            
            var view = new Views.MessageView({
                model : message
            }).render();
            
            this.model.view && this.model.view.highlight();
            this.messageList.append(view.el)
                .scrollTop(this.messageList[0].scrollHeight);
            
            // Check to see if the user is at the bottom of the list,
            // before scrolling, allowing them to read old msg's
            /**
            if (this.messageList.scrollTop() + 100 >= this.messageList.height()) {
                this.messageList
                    .animate({scrollTop : this.messageList[0].scrollHeight});
            }
            **/
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
            var username = window.user.get('username');
            var id = window.user.get('id') || window.user.id;
            
            return {
                text        : this.input.val(),
                room_id     : this.model.get('id'),
                user_id     : id,
                username    : (username == Models.UserModel.defaults) ? id : window.user.get('username'),
                displayName : window.user.get('displayName') || window.user.get('username'),
                avatar      : window.user.get('avatar')
            };
        },
    });
    
    Views.ConversationView = Views.RoomMainView.extend({
    
        // DOM attributes
        tagName        : 'div',
        className      : 'conversation open',
        template       : _.template($('#conversation-template').html()),
        statsTemplate  : _.template($('#room-stats-template').html()),
        
        // Interaction events
        events    : {
            'click .heading'               : 'toggleOpen',
            'keypress .message-form input' : 'createMessageOnEnter',
            'click .message-form button'   : 'createMessage',
            'click .destroy'               : 'remove',
            'click .add-favorite'          : 'addToFavorites',
            'click .remove-favorite'       : 'removeFromFavorites',
            'click .delete-room'           : 'deleteRoom',
        },
        
        // Constructor
        initialize : function(options) {
            this.viewable = this.model.allowedToView(window.user);
            
            if (!this.viewable) {
                return;
            }
            
            _.bindAll(this, 
                'allMessages', 'addMessage', 'createMessage', 'render',
                'remove'
            );
            
            // Bind to model
            this.model.mainView = this;
            this.model.bind('change', this.render);
            this.model.bind('remove', this.remove);
            
            this.model.messages = new Models.MessageCollection();
            this.model.messages.url = Helpers.getUrl(this.model) + ':messages';
            
            this.model.messages.bind('add', this.addMessage);
            this.model.messages.bind('refresh', this.allMessages);
            this.model.messages.bind('add', this.render);
            
            // Send model contents to the template
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);            
            $(this.el)
                .html(view)
                .find('[title]')
                .wijtooltip();
            
            // Set shortcut methods for DOM items
            this.title       = this.$('.headline');
            this.controls    = this.$('.controls');
            this.description = this.$('.description');
            this.input       = this.$('.create-message');
            this.messageList = this.$('.messages');
            
            var self = this;
            
            // Post-formatting, done here as to prevent conflict
            // with Mustache HTML entity escapement
            content.name && this.title.html(Helpers.linkify(content.name));
            content.description && this.description.html(Helpers.linkify(content.description));
            
            this.model.messages.subscribe({}, function() {
                self.model.messages.fetch({
                    query    : {room_id : self.model.get('id')},
                    sorting  : {sort: [['created',-1]], limit: 20},
                    finished : function(data) {
                    },
                });
            });
            
            this.input.focus();
        },
        
        startConversation : _.debounce(function() {
            var self = this;
            Server.startConversation(window.user.toJSON(), {
                channel : self.model.url,
                id      : self.model.get('to')
            }, function(resp, options) {
                console.log('convo started doublecheck: ', resp);
            });
        }, 1000),
        
        // Send a message to the server
        createMessage : function() {
            if (!this.input.val()) return;
            this.startConversation();
            this.model.messages.create(this.newAttributes());
            this.input.val('');
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            this.model && this.model.remove();
            this.model.unsubscribe();
            this.model.messages.unsubscribe();
            $(this.el).remove();
            delete this.model;
            delete this;
        },
        
        toggleOpen : function() {
            $(this.el).toggleClass('open');
        },
        
        // Generate the attributes
        newAttributes : function() {
            var username = window.user.get('username');
            var id = window.user.get('id') || window.user.id;
            
            return {
                text        : this.input.val(),
                room_id     : this.model.get('id'),
                user_id     : id,
                username    : (username == Models.UserModel.defaults) ? id : window.user.get('username'),
                displayName : window.user.get('displayName') || window.user.get('username'),
                avatar      : window.user.get('avatar'),
                type        : 'private'
            };
        },
    
    });
    
})(Views)