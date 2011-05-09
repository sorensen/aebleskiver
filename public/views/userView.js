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
            console.log('User view init: ', options);
            
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
            //this.model.bind('remove', this.clear);
            this.model.view = this;
            
            // Send model contents to Mustache
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);
            console.log('user before render: ');
            $(this.el).html(view);
        },
    
        // Re-render contents
        render : function() {
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
        className : 'user inactive',
        template  : _.template($('#user-template').html()),
        
        // The DOM events specific to an item.
        events : {
            "click .destroy" : "deactivate"
        },
    
        initialize : function(options) {
            console.log('User main view init: ', options);
            console.log('User main view init: ', this);
            
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
            //this.model.bind('remove', this.clear);
            this.model.view = this;
            
            // Send model contents to Mustache
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);   
            console.log('user before render2: ');         
            $(this.el).html(view);
        },
    
        // Re-render contents
        render : function() {
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