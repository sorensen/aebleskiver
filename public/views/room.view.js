//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function(ß) {
    // Room room Views
    // -----------------
    
    // Both the simple 'Room' view and the full 'MainRoom'
    // view share the same room model, with the main difference
    // being that the 'Room' view does not hold a message
    // collection, and provides different updates
    
    // Room room
    ß.Views.RoomView = Backbone.View.extend({
    
        // DOM attributes
        tagName        : 'div',
        className      : 'room inactive',
        template       : _.template($('#room-list-template').html()),
        rankTemplate   : _.template($('#room-rank-template').html()),
        
        // Interaction events
        events : {
            'click .upvote'   : 'upVote',
            'click .downvote' : 'downVote'
        },
        
        // Constructor
        initialize : function(options) {
            // Bind to model
            _.bindAll(this, 'render', 'highlight', 'remove', 'statistics');
            
            this.model.view = this;
            this.model.bind('change', this.statistics);
            this.model.bind('remove', this.remove);
            this.loaded = 0;
        },
        
        render : function() {
            // Send model contents to the template
            var content = this.model.toJSON();
            
            // Pre-rendering formatting to prevent XSS
            content.name = this.model.escape('name');
            content.description = this.model.escape('description');
            
            var view = Mustache.to_html(this.template(), content);            
            $(this.el).html(view);
            this.statistics();
            return this;
        },
        
        // Refresh statistics
        statistics : function() {
            console.log('statistics', this);
            var rank = this.model.get('upvotes') - this.model.get('downvotes'),
                view = Mustache.to_html(this.rankTemplate(), {
                    rank : rank
                });
            
            this.$('.ranking').html(view);
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
        leave : function() {            
            $(this.el)
                .removeClass('active')
                .removeClass('current')
                .addClass('inactive');
        },
    });
    
    // Room room
    ß.Views.RoomMainView = Backbone.View.extend({
    
        // DOM attributes
        tagName        : 'div',
        className      : 'main-room',
        template       : _.template($('#room-template').html()),
        statsTemplate  : _.template($('#room-stats-template').html()),
        
        lastPoster : '',
        
        // Interaction events
        events : {
            'keypress .message-form input' : 'createMessageOnEnter',
            'click #message-submit'        : 'createMessage',
            'click #leave-room'            : 'leave',
            'click #add-favorite'          : 'addToFavorites',
            'click #remove-favorite'       : 'removeFromFavorites',
            'click .delete-room'           : 'deleteRoom',
        },
        
        // Constructor
        initialize : function(options) {
            this.viewable = this.model.allowedToView(ß.user);
            if (!this.viewable) {
                return;
            }
            
            _.bindAll(this, 
                'allMessages', 'addMessage', 'createMessage', 'render',
                'remove', 'statistics'
            );
            
            // Bind to model
            this.model.mainView = this;
            this.model.bind('change', this.statistics);
            this.model.bind('remove', this.remove);
            
            this.model.messages = new ß.Models.MessageCollection();
            this.model.messages.url = _.getUrl(this.model) + ':messages';
            
            this.model.messages.bind('add',   this.addMessage);
            this.model.messages.bind('reset', this.allMessages);
            this.model.messages.bind('add',   this.statistics);
            
            // Send model contents to the template
            var content = this.model.toJSON(),
                self    = this;
            
            // Pre-formatting to prevent XSS
            content.name = this.model.escape('name');
            content.description = this.model.escape('description');
            
            var view = Mustache.to_html(this.template(), content);            
            $(this.el).html(view);
            
            // Set shortcut methods for DOM items
            this.title       = this.$('.headline');
            this.controls    = this.$('.controls');
            this.description = this.$('.description');
            this.input       = this.$('.create-message');
            this.messageList = this.$('.messages');
            
            // Post-formatting, done here as to prevent conflict
            // with Mustache HTML entity escapement
            this.title.html(_.linkify(self.model.escape('name')));
            this.description.html(_.linkify(self.model.escape('description')));
            
            this.input.focus();
            
            this.editable = this.model.allowedToEdit(ß.user);
            // Check if the current user is the room creator
            if (this.editable) {
                $(this.el).addClass('editable');
            } else {
                this.$('.admin-controls').remove();
            }
            
            this.model.messages.subscribe({}, function() {
                self.model.messages.fetch({
                    query    : {room_id : self.model.get('id')},
                    sorting  : {sort: [['created',-1]], limit: 20},
                    finished : function(data) {
                    },
                });
            });
        },
        
        // Render view
        render : function() {
            return this;
        },
        
        // Statistics
        statistics : function() {
            var totalMessages = this.model.messages.length;
            this.$('.room-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalMessages : totalMessages
            }));
            return this;
        },
        
        deleteRoom : function() {
            this.model.destroy();
        },
        
        addToFavorites : function() {
            if (this.model.get('id') == ß.user.get('id')
                || this.model.get('id') == ß.user.id) {
                return;
            }
            
            var favorites = ß.user.get('favorites') || [],          
                find = _.indexOf(favorites, this.model.get('id'));
            
            if (find !== -1) {
                return;
            }
            favorites.push(this.model.get('id'));
            
            ß.user.set({
                favorites : _.unique(favorites)
            }).save();
            
            ß.user.favorites.add(this.model);
        },
        
        removeFromFavorites : function() {
            var id = this.model.get('id'),
                favorites = _.without(ß.user.get('favorites'), id);
            
            var person = ß.user.favorites.get(id);
            $(person.view.el).remove();
            
            ß.user.favorites.remove(this.model, {
                silent : true
            });
            ß.user.set({
                favorites : favorites
            }).save();
        },
        
        // Tell the application to remove this room
        leave : function() {
            Backbone.history.saveLocation('/');
            this.view.deactivateRoom(this.model);
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            this.model.view && this.model.view.leave();
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
            this.statistics()
                .messageList
                .delay(400)
                .animate({scrollTop : this.messageList[0].scrollHeight}, 1000, 'easeInExpo');
                //.scrollTop(this.messageList[0].scrollHeight);
        },
        
        addMessage : function(message) {
            //this.concurrency(message);
            
            var view = new ß.Views.MessageView({
                model : message
            }).render();
            
            this.model.view && this.model.view.highlight();
            this.messageList.append(view.el)
                .scrollTop(this.messageList[0].scrollHeight);
            
            // Check to see if the user is at the bottom of the list,
            // before scrolling, allowing them to read old msg's
            console.log('room.view: list:',this.messageList.height());
            console.log('room.view: scrollTop:',this.messageList.scrollTop());
            /**
            if (this.messageList.scrollTop() + 100 >= this.messageList.height()) {
                this.messageList
                    .animate({scrollTop : this.messageList[0].scrollHeight});
            }
            **/
        },
        
        // Send a message to the ß.Server
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
            var username    = ß.user.get('username'),
                displayName = ß.user.get('displayName') || ß.user.get('username'),
                id          = ß.user.get('id') || ß.user.id;
            
            return {
                text        : this.input.val(),
                room_id     : this.model.get('id'),
                user_id     : id,
                username    : username,
                displayName : displayName,
                avatar      : ß.user.get('avatar')
            };
        },
    });
    
    ß.Views.ConversationView = ß.Views.RoomMainView.extend({
    
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
            this.viewable = this.model.allowedToView(ß.user);
            if (!this.viewable) {
                return;
            }
            
            _.bindAll(this, 
                'allMessages', 'addMessage', 'createMessage', 'render',
                'remove', 'statistics'
            );
            
            // Bind to model
            this.model.mainView = this;
            this.model.bind('change', this.statistics);
            this.model.bind('remove', this.remove);
            
            this.model.messages = new ß.Models.MessageCollection();
            this.model.messages.url = _.getUrl(this.model) + ':messages';
            
            this.model.messages.bind('add',   this.addMessage);
            this.model.messages.bind('reset', this.allMessages);
            this.model.messages.bind('add',   this.statistics);
            
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
            content.name        && this.title.html(_.linkify(content.name));
            content.description && this.description.html(_.linkify(content.description));
            
            this.model.messages.subscribe({}, function() {
                self.model.messages.fetch({
                    query    : {room_id : self.model.get('id')},
                    sorting  : {sort: [['created',-1]], limit: 20},
                    finished : function(data) {
                    },
                });
            });
            
            this.input.focus();
            console.log('room.view:', this);
        },
        
        startConversation : _.debounce(function() {
            var self = this;
            ß.Server.startConversation(ß.user.toJSON(), {
                channel : self.model.url,
                id      : self.model.get('to')
            }, function(resp, options) {
                // Conversation started
            });
        }, 1000),
        
        // Send a message to the ß.Server
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
    
    });
    
})(ß)