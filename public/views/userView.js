(function(Views) {
    // Chat view
    // -----------------
    
    // User ( Client )
    Views.UserView = Backbone.View.extend({
        tagName   : 'div',
        className : 'user inactive',
        
        // The DOM events specific to an item.
        events : {
            "dblclick" : "toggleActive"
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
})(Views)