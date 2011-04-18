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
        statsTemplate  : _.template($('#room-stats-template').html()),
        
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
            
            // Send model contents to the template
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el).html(view);
        },
        
        // Refresh statistics
        render : function() {
            var totalMessages = this.model.get('messages').length;
            this.$('.room-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalMessages : totalMessages
            }));
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
    
    // Room room
    Views.RoomMainView = Backbone.View.extend({
    
        // DOM attributes
        tagName        : 'div',
        className      : 'main-room',
        template       : _.template($('#room-template').html()),
        statsTemplate  : _.template($('#room-stats-template').html()),
        
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
            this.model.populate();
            
            // Bind to model
            this.model.bind('change', this.render);
            this.model.view = this;
            this.model.messages.bind('add', this.addMessage);
            
            // Send model contents to the template
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            $(this.el).html(view);
            
            // Set shortcut methods for DOM items
            this.input       = this.$(".create-message");
            this.messagelist = this.$(".messages");
            this.input.focus();
            this.render();
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
            
            console.log('addMessage: ', view);
            
            this.messagelist
                .append(view.el)
                .scrollTop(this.messagelist[0].scrollHeight);
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
                room     : this.model.escape('id'),
                text     : this.input.val(),
                username : window.user.get('username'),
                avatar   : window.user.get('avatar')
            };
        },
    });
})(Views)