(function(Views) {
    // Chat room views
    // -----------------
    
    // Both the simple 'Chat' view and the full 'MainChat'
    // view share the same chat model, with the main difference
    // being that the 'Chat' view does not hold a message
    // collection, and provides different updates
    
    // Chat room
    Views.ChatView = Backbone.View.extend({
    
        // DOM attributes
        tagName   : 'div',
        className : 'chat inactive',
        template  : _.template($('#chat-list-template').html()),
        
        // Interaction events
        events : {
            "click" : "activate"
        },
        
        // Constructor
        initialize : function(options) {
            // Bind to model
            _.bindAll(this, 'render');
            this.render = _.bind(this.render, this);
            this.model.bind('change', this.render);
            this.model.view = this;
        },
        
        // Refresh
        render : function() {
            // Send model contents to the template
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el).html(view);
            return this;
        },
        
        // Remove this view from the DOM.
        remove : function() {
            this.el.remove();
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
    
        // DOM attributes
        tagName   : 'div',
        className : 'main-chat',
        template  : _.template($('#chat-template').html()),
        
        // Interaction events
        events    : {
            "submit .message-form"        : "createMessage",
            "click .message-form button"  : "createMessage",
            "click .destroy"              : "deactivate"
        },
        
        // Constructor
        initialize : function(options) {
            _.bindAll(this, 
                'addMessage', 'createMessage', 'render'
            );
            this.render = _.bind(this.render, this);           
            
            // Bind to model
            this.model.bind('change', this.render);
            this.model.view = this;
            this.model.messages.bind('add', this.addMessage);
        },
        
        // Render contents
        render : function() {
            // Send model contents to the template
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el).html(view);
            
            // Set shortcut methods for DOM items
            this.input       = this.$(".create-message");
            this.messagelist = this.$(".messages");
            this.input.focus();
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
            this.model.remove();
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
        createMessage : function() {
            if (!this.input.val()) return;
            this.model.createMessage(this.newAttributes());
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