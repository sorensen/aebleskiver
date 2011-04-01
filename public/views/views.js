(function() {
    // Application Views
    // -----------------
    
    // The app contains users, worlds, chat rooms, messages
    var Views;
    if (typeof exports !== 'undefined')    {
        _           = require('underscore')._;
        Backbone    = require('backbone');
        Views       = exports;
    } else {
        Views = this.Views = {};
    }
    
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
    
        // Re-render contents
        render : function() {
            // Send model contents to Mustache
            var content = this.model.toJSON();            
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el).html(view);
            return this;
        }
    });
    
    // Chat room
    Views.ChatView = Backbone.View.extend({
        tagName : 'div',
        className : 'chat inactive',
        
        // Mustache Template
        template : _.template($('#chat-template').html()),
        
        // The DOM events specific to an item.
        events : {
            "click"         : "focusInput",
            "submit form"   : "sendMessage",
            "click button"  : "sendMessage",
            "dblclick"      : "toggleActive"
        },
        
        initialize : function(options) {
            _.bindAll(this, 
                'msgReceived', 'addMessage', 'sendMessage', 'render', 
                'updateOnEnter', 'joinChannel', 'leaveChannel'
            );
            
            this.render = _.bind(this.render, this);            
            if (options.client) this.client = options.client;
            
            // Send model contents to Mustache
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el)
                .html(view)
                .resizable({
                    animate: true,
                    ghost: true
                });

            // Set shortcut methods for DOM items
            this.input          = $(this.el).find(".chat-box");
            this.messagelist    = $(this.el).find(".message-list");
            
            // Bind to model
            this.model.bind('change', this.render);
            this.model.view = this;
            
            this.model.messages.client = this.client;
            this.model.messages.bind('add',     this.addMessage);
            this.model.messages.bind('all',     this.render);
            
            //this.rpc = new Synchronize(self.model.messages, {fetch : true});
            this.rpc = new Synchronize(this.model.messages, {fetch : true});
        },
        
        // Refresh
        render : function() {
            return this;
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
            
            $(this.el)
                .parent()
                .masonry();
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
                
            $(this.el)
                .parent()
                .masonry();
        },
        
        addMessage : function(message) {
            var view = new Views.MessageView({
                model : message
            }).render();
            
            this.messagelist
                .prepend(view.el)
            
            var current = $(this.el).attr('class').indexOf('current');
            if (current === -1) {
                $(this.el)
                    .effect('highlight', {color : '#ccc'}, 1000)
                    .unbind('effect');
            }
        },
        
        // Add all items in the collection at once.
        addAllMessages : function() {
            this.model.messages.each(this.addOne);
        },
        
        // Send a message to the server
        sendMessage : function() {
            if (!this.input.val()) return;
            this.model.messages.create(this.newAttributes());
            this.input.val('');
        },
        
        // Generate the attributes
        newAttributes : function() {
            return {
                chat :        this.model.escape('id'),
                text :        this.input.val(),
                username :     $('#client .username').html()
            };
        },
    });
    
    // World of chats
    Views.WorldView = Backbone.View.extend({
        tagName : 'div',
        className : 'world',
        
        // Mustache Template
        template : _.template($('#world-template').html()),
        
        // The DOM events specific to an item.
        events : {
            "submit .feature-content form"  : "createChat",
        },
        
        // Constructor
        initialize : function(options) {
            // Bindings
            _.bindAll(this, 'render', 'addChat', 'addAllChats', 'createChat');
            
            this.render = _.bind(this.render, this);
            this.model.bind('change',  this.render);
            
            // Send model contents to Mustache
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el).html(view);
            
            // Get the current client by username ( TEMPORARY )    
            var newClient = $('#client .username').html();
            this.client = newClient;
            
            // Set shortcuts to collection DOM
            this.input      = $(this.el).find('.join-room');
            this.chatlist   = $(this.el).find('.chat-list');
            this.userlist   = $(this.el).find('.user-list');            
            
            // Bind chats collection
            this.model.chats.bind('add',    this.addChat);
            this.model.chats.bind('all',    this.render);
            
            this.rpc = new Synchronize(this.model.chats, {fetch : true});
        },
        
        // Refresh
        render : function() {
            return this;
        },
        
        // Add a single chat room to the current veiw
        addChat : function(chat) {
            chat.messages.url = chat.collection.url + ":" + chat.id + ":messages";
            
            var view = new Views.ChatView({
                model : chat
            }).render();
            
            $(this.el)
                .find('.chat-list')
                .append(view.el)
                .masonry(
                {
                    columnWidth : 50,
                    itemSelector : '.chat',
                    animate : true,
                    animationOptions : {
                        duration : 750,
                        easing : 'linear',
                        queue : false
                    }                    
                });
        },
        
        // Add all items in the collection at once.
        addAllChats : function() {
            this.model.chats.each(this.addChat);
        },
        
        // Create new chat room
        createChat : function() {
            if (!this.input.val()) return;
            this.model.chats.create(this.newChatAttributes());
            this.input.val('');
        },
        
        // Generate the attributes for a new chat
        newChatAttributes : function() {
            return {
                name : this.input.val()
            };
        }
    });
    
    // Application
    Views.ApplicationView = Backbone.View.extend({
        // DOM element
        className : 'wrapper',
        tagName : 'div',
        
        // Initialization
        initialize : function(options) {
            _.bindAll(this, 'render');    
            this.render = _.bind(this.render, this);
            
            // Backbone history and action router
            this.router = new Controllers.Router();

            // Set the model directly
            this.model = new Models.WorldModel({
                id   : '_0',
                url  : 'worlds:_0',
                name : "Location: Omaha, Nebraska"
            });
            
            // Set view directly
            this.view = new Views.WorldView({
                model : this.model      
            });
            
            // Since there is only one world, set directly
            this.view.render();
            $(this.el).html(this.view.el);
            
            //this.rpc = new Synchronize(self.model, {fetch : true});
        },
        
        // Render contents
        render : function() {
            return this;
        }
    });
})()