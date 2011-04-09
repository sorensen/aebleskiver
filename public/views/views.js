(function() {
    // Application Views
    // -----------------
    
    // The app contains users, worlds, chat rooms, messages
    var Views;
    if (typeof exports !== 'undefined')    {
        _        = require('underscore')._;
        Backbone = require('backbone');
        Views    = exports;
    } else {
        Views = this.Views = {};
    }
    
    // User ( Client )
    Views.UserView = Backbone.View.extend({
        tagName : 'div',
        className : 'user chat inactive',
        
        // The DOM events specific to an item.
        events : {
            "dblclick"             : "toggleActive"
        },
        
        // Mustache Template
        template : _.template($('#user-template').html()),
    
        initialize : function(options) {
            _.bindAll(this, 'render', 'clear');
            this.model.bind('all', this.render);
            this.model.bind('remove', this.clear);
            this.model.view = this;
            
            // Send model contents to Mustache
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el).html(view);
        },
    
        // Re-render contents
        render : function() {
            return this;
        },
        
        // Remove the item, destroy the model.
        clear : function() {
            this.model.clear();
        },
    });
    
    // Message
    Views.MessageView = Backbone.View.extend({
        tagName : 'li',
        className : 'message',
        
        // Mustache Template
        template : _.template($('#message-template').html()),
    
        initialize : function(options) {
            _.bindAll(this, 'render');
            this.model.bind('all', this.render);
            
            // Set direct reference to the view
            this.model.view = this;
        },

        // Toggle the item state
        toggle: function() {
            this.set({read: !this.get("read")});
        },
        
        // Remove this view from the DOM.
        remove : function() {
            //$(this.el).remove();
        },
    
        // Re-render contents
        render : function() {
            // Send model contents to Mustache
            var content = this.model.toJSON();
            content.created = clockTime(content.created);
            var view = Mustache.to_html(this.template(content), content);
            $(this.el).html(view);
            return this;
        }
    });
    
    // Chat room
    Views.ChatView = Backbone.View.extend({
        tagName   : 'div',
        className : 'chat inactive',
        
        // Mustache Template
        template : _.template($('#chat-list-template').html()),
        
        // The DOM events specific to an item.
        events : {
            "click" : "toggleActive"
        },
        
        initialize : function(options) {
            _.bindAll(this, 
                'addMessage', 'sendMessage', 'render', 
                'updateOnEnter', 'joinChannel', 'leaveChannel'
            );
            
            this.render = _.bind(this.render, this);           
            
            // Send model contents to Mustache
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el)
                .html(view);
                
            // Bind to model
            this.model.bind('change', this.render);
            this.model.view = this;
        },
        
        // Refresh
        render : function() {
            return this;
            var done = Todos.done().length;
            this.$('.statistics').html(this.statsTemplate({
                total     : Todos.length,
                done      : Todos.done().length,
                remaining : Todos.remaining().length
            }));
        },
        
        // Remove this view from the DOM.
        remove : function() {
            $(this.el).remove();
        },
        
        // Remove this view from the DOM.
        focusInput : function() {
            this.input.focus();
        },
        
        // Remove the item, destroy the model.
        clear : function() {
            this.model.clear();
        },
        
        toggleActive : function() {
            var check = $(this.el).attr('class').indexOf('current');
            if (check === -1) {
                this.activate();
            } else {
                this.deactivate();
            }
        },
        
        // Join Channel
        activate : function() {            
            $(this.el)
                .addClass('current')
                .removeClass('inactive')
                .siblings()
                .addClass('inactive')
                .removeClass('current');
        },
        
        // Leave Channel
        deactivate : function() {
            $(this.el)
                .addClass('inactive')
                .removeClass('current');
                
            $(this.el)
                .siblings()
                .addClass('inactive')
                .removeClass('current');
        },
    });
    
    // Chat room
    Views.ChatMainView = Backbone.View.extend({
        tagName   : 'div',
        className : 'main-chat',
        
        // Mustache Template
        template : _.template($('#chat-template').html()),
        
        // The DOM events specific to an item.
        events : {
            "submit .message-form"        : "sendMessage",
            "click .message-form button"  : "sendMessage",
            "click .destroy"              : "deactivate"
        },
        
        initialize : function(options) {
            _.bindAll(this, 
                'addMessage', 'sendMessage', 'render', 'leaveChannel'
            );
            
            this.render = _.bind(this.render, this);           
            
            // Bind to model
            this.model.bind('change', this.render);
            this.model.view = this;
            
            this.model.messages.bind('add', this.addMessage);
            
            // Send model contents to Mustache
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el).html(view);
            
            // Set shortcut methods for DOM items
            this.input       = $(this.el).find(".create-message");
            this.messagelist = $(this.el).find(".messages");
            
            this.focusInput();
            var self = this;
            var add = true;
            if (this.model.messages.length === 0) add = false;
            
            // Sync up with the server through DNode
            Synchronize(this.model.messages, {
                // Fetch data from server
                finished : function(data) {
                    self.model.attributes.messages = _.uniq(self.model.attributes.messages);
                    
                    _.each(self.model.attributes.messages, function(id) {
                        var model = new Models.MessageModel();
                        
                        model.set({id : id});
                        model.collection = self.model.messages;
                        
                        model.fetch({
                            finished : function(data) {
                                //if (!self.model.messages.get(data.id)) self.model.messages.add(data);
                                if (add) self.model.messages.add(data);
                            },
                        });
                    });
                },
            });
        },
        
        // Refresh
        render : function() {
            return this;
        },
        
        deactivate : function() {
            Application.deactivateChat(this.model);
        },
        
        // Remove this view from the DOM.
        remove : function() {
            var self = this;
            // Sync up with the server through DNode
            Synchronize(this.model.messages, {
                // Fetch data from server
                unsubscribe : true,
                finished : function(data) {
                    self.model.messages.each(function(message) {
                        //message.clear();
                    });
                },
            });
        },
        
        // Remove this view from the DOM.
        focusInput : function() {
            this.input.focus();
        },
        
        // Remove the item, destroy the model.
        clear : function() {
            this.model.clear();
        },
        
        addMessage : function(message) {
            message.created = new Date().getTime();
            
            var view = new Views.MessageView({
                model : message
            }).render();
            
            this.messagelist
                .append(view.el);
            
            this.messagelist.scrollTop(
                this.messagelist[0].scrollHeight
            );
            
            delete message.created;
        },
        
        // Send a message to the server
        sendMessage : function() {
            if (!this.input.val()) return;
            
            var self = this;
            this.model.messages.create(this.newAttributes(), {
                silent : true,
                finished : function(data) {
                    var keys = _.without(self.model.get('messages'), data.id);
                    if (keys.length > 50) keys = _.rest(keys, (keys.length - 50));
                    keys.push(data.id);
                    self.model.set({messages : keys}).save({silent : true});
                    delete keys;
                }
            });
            this.input.val('');
        },
        
        // Generate the attributes
        newAttributes : function() {
            return {
                chat     : this.model.escape('id'),
                text     : this.input.val(),
                username : window.user.get('username'),
                avatar   : window.user.get('avatar')
            };
        },
    });
    
    // Application
    Views.ApplicationView = Backbone.View.extend({
        // DOM element
        className : 'wrapper',
        tagName   : 'div',
        
        // The DOM events specific to an item.
        events : {
            "submit #chat-form" : "createChat",
        },
        
        // Mustache Template
        template : _.template($('#application-template').html()),
        
        // Initialization
        initialize : function(options) {
            _.bindAll(this, 'render', 'addChat', 'createChat', 'addUser', 'addGame', 'createGame');    
            this.render = _.bind(this.render, this);

            // Set the model directly
            this.model = new Models.ApplicationModel({
                id : 's1'
            });
            
            // Bind chats collection
            this.model.users.bind('add', this.addUser);
            this.model.chats.bind('add', this.addChat);
            
            // Send model contents to Mustache
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el).html(view);
            
            var key = $('#client').html();
            window.user = new Models.UserModel({id : key});
            
            // Set shortcuts to collection DOM
            this.userInput = $(this.el).find('#create-user');
            this.chatInput = $(this.el).find('#create-chat');
            
            this.userList = $(this.el).find('#users');
            this.chatList = $(this.el).find('#chats');
            
            var self = this;
            var userCallback = function(model) {
                window.user.set(model);
                window.user.set({
                    visits : model.visits + 1,
                    status : 'online',
                });
                Gravatar(model, {
                    finished : function(data) {
                        console.log('avatar', data);
                        if (!data) return;
                        window.user.set({ avatar : data.image }).save();
                    },
                    size : 40,
                });
            };
            // Callback for when server synchronization
            // has been completed
            var finished = function() {
                // Find all users
                Synchronize(window.user, {
                    fetch : {
                        finished : function(model) {
                            userCallback(model);
                        },
                        error : function(model) {
                            userCallback(model);
                        },
                    }
                });
                
                // Sync up with the server through DNode
                Synchronize(self.model.chats, {
                    // Fetch data from server
                    finished : function(data) {
                        // Set a model for each id found for lookups
                        _.each(self.model.attributes.chats, function(id) {
                            self.model.chats.add({id : id}, {silent : true});
                        });
                        
                        // Use backbone to fetch from the server
                        self.model.chats.each(function(chat) {
                            chat.fetch({
                                finished : function(data) {
                                    self.model.chats.add(data);
                                    
                                },
                            });
                        });
                    },
                });
            };
            
            // Sync up with the server through DNode
            Synchronize(this.model, {
                // Fetch data from server
                fetch : {
                    finished : function(data) {
                        // Increment some arbitrary number
                        self.model.set({visits : data.visits + 1}).save();
                        finished();
                    },
                    error : function(data) {
                        // No existing data could be found
                        self.model.save();
                        finished();
                    },
                },
            });
        },
        
        // Render contents
        render : function() {
            return this;
        },
        
        // Add a single chat room to the current veiw
        addUser : function(user) {
            var view = new Views.UserView({
                model : user
            }).render();
            
            $(this.el)
                .find('#users')
                .append(view.el);
        },
        
        // Add a single chat room to the current veiw
        addChat : function(chat) {
            chat.messages.url = chat.collection.url + ":" + chat.id + ":messages";
            
            var view = new Views.ChatView({
                model : chat
            }).render();
            
            console.log('add chat', chat);
            $(this.el)
                .find('#chats')
                .append(view.el);
        },
        
        deactivateChat : function() {
            $(this.el)
                .find('#main-content')
                .fadeOut(300, function(){
                    $(this).html('');
                });
                
            // Join Channel
            this.activeChat && this.activeChat.remove();
        },
        
        activateChat : function(params) {
            this.deactivateChat();
            
            
            // Get model by name
            var model = this.model.chats.get(params);
            console.log('model: ', model);
            
            if (!model) return;
            console.log('model: ', model.url());
        
            this.activeChat = new Views.ChatMainView({
                model : model
            }).render();
            
            var self = this;
            $(this.el)
                .find('#main-content')
                .fadeIn(300, function(){
                    $(this).html(self.activeChat.el);
                    self.activeChat.messagelist.scrollTop(
                        self.activeChat.messagelist[0].scrollHeight
                    );
                    delete self;
                });
        },
        
        // Generate the attributes for a new chat
        newChatAttributes : function() {
            return {
                name : this.chatInput.val()
            };
        },
        
        // Create new chat room
        createChat : function() {
            if (!this.chatInput.val()) return;
            
            var self = this;
            this.model.chats.create(this.newChatAttributes(), {
                finished : function(data) {
                    var keys = self.model.get('chats');
                    if (keys) {
                        keys.push(data.id);
                        if (keys.length > 50) keys = _.rest(keys, (keys.length - 50));
                        self.model.set({chats : _.uniq(keys)}).save();
                        delete keys;
                    }
                }
            });
            this.chatInput.val('');
        },
    });
})()