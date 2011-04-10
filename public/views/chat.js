(function(Views) {
    // Chat room views
    // -----------------
    
    // Both the simple 'Chat' view and the full 'MainChat'
    // view share the same chat model, with the main difference
    // being that the 'Chat' view does not hold a message
    // collection, and provides different updates
    
    // Chat room
    Views.ChatView = Backbone.View.extend({
        tagName   : 'div',
        className : 'chat inactive',
        
        // Mustache Template
        template : _.template($('#chat-list-template').html()),
        
        // The DOM events specific to an item.
        events : {
            "click" : "activate"
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
            $(this.el).html(view);
                
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
            this.input = $(this.el).find(".create-message");
            this.messagelist = $(this.el).find(".messages");
            this.input.focus();
            
            var self = this;
            var add = (this.model.messages.length === 0) ? false : true;
            
            // Wrap remote procedure calls with a 'sync' object
            // This will make sure that there is a connection between 
            // the client and the server before executing
            Synchronize(this.model.messages, {
            
                // Fetch data from server
                finished : function(data) {
                    self.model.attributes.messages = _.uniq(self.model.attributes.messages);
                    
                    // Models that contain collections hold an array of 
                    // id's, backbone will build the complete url/key
                    _.each(self.model.attributes.messages, function(id) {
                    
                        // Create a backbone object
                        var model = new Models.MessageModel();
                        
                        // Set the lookup id
                        model.set({id : id});
                        
                        // Tell backbone that incomming model belongs 
                        // to this model's message collection
                        model.collection = self.model.messages;
                        
                        // Fetch the data from the server
                        model.fetch({
                        
                            // This will be called from the server through 
                            // DNode once the async processing is done
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
            //TODO: Update view with model 
            // statistics and clear out all 
            // existing message views to be re-rendered
            return this;
        },
        
        // Tell the application to remove this chat room
        deactivate : function() {
            //TODO: Move to the controller or 
            // affect the display only
            Application.deactivateChat(this.model);
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            var self = this;
            Synchronize(this.model.messages, {
            
                // RPC command
                unsubscribe  : {
                
                    // Callback function from the server
                    finished : function(data) {
                        self.model.messages.each(function(message) {
                            //message.clear();
                        });
                    },
                },
            });
        },
        
        addMessage : function(message) {
            var view = new Views.MessageView({
                model : message
            }).render();
            
            this.messagelist
                .append(view.el)
                .scrollTop(this.messagelist[0].scrollHeight);
                
            delete message.created;
        },
        
        // Send a message to the server
        sendMessage : function() {
            if (!this.input.val()) return;
            var self = this;
            this.model.messages.create(this.newAttributes(), {
            
                // Remote callback
                finished : function(data) {
                
                    // Add the newly created ID to this model's
                    // key collection for future lookups
                    var keys = _.without(self.model.get('messages'), data.id);
                    keys.push(data.id);
                    
                    // Only keep the last 200 messages that were sent, the rest will 
                    // become archived by virtue of not being used any further
                    if (keys.length > 200) keys = _.rest(keys, (keys.length - 200));
                    self.model.set({messages : keys}).save();
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