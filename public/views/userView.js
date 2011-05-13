(function(Views) {
    // User views
    // -----------------
    
    // User ( Client )
    Views.UserView = Backbone.View.extend({
    
        // DOM attributes
        tagName   : 'div',
        className : 'user inactive',
        template  : _.template($('#user-list-template').html()),
        
        // The DOM events specific to an item.
        events : {
            "click" : "activate"
        },
    
        initialize : function(options) {
            _.bindAll(this, 'render');
            
            this.model.bind('change', this.render);
            this.model.bind('remove', this.clear);
            this.model.view = this;
            
            this.render();
        },
    
        // Re-render contents
        render : function() {
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);
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
    
    // User ( Client )
    Views.UserMainView = Backbone.View.extend({
    
        // DOM attributes
        tagName   : 'div',
        className : 'user-profile',
        template  : _.template($('#user-template').html()),
        
        // The DOM events specific to an item.
        events : {
            "click .destroy" : "deactivate"
        },
    
        initialize : function(options) {
            _.bindAll(this, 'render');
            
            this.model.bind('change', this.render);
            this.model.bind('remove', this.clear);
            this.model.view = this;
            
            var self = this;
            // Request a gravatar image for the current 
            // user based on email address
            Server.gravatar({
                email : self.model.get('email'),
                size  : 100
            }, function(resp) {
                self.model.set({ avatar : resp });
            });
            
            this.render();
        },
    
        // Render contents
        render : function() {
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);   
            $(this.el).html(view);
            return this;
        },
        
        // Remove this view from the DOM.
        remove : function() {
            this.model && this.model.remove();
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
        
        // Tell the application to remove this room
        deactivate : function() {
            //TODO: Move to the controller or 
            // affect the display only
            Application.deactivateUser(this.model);
            Backbone.history.saveLocation('/');
        },
    });

})(Views)