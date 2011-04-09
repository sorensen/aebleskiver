(function(Views) {
    // Message view
    // -----------------
    
    // Message
    Views.MessageView = Backbone.View.extend({
        tagName   : 'li',
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
            var view = Mustache.to_html(this.template(content), content);
            $(this.el).html(view);
            return this;
        }
    });
})(Views)