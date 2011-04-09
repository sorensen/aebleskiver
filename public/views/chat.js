(function(Views) {
    // Chat view
    // -----------------
    
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
})(Views)