(function(Views) {
    // Message view
    // -----------------
    
    // Single room message
    Views.MessageView = Backbone.View.extend({
        
        // DOM attributes
        tagName   : 'li',
        className : 'message',
        template  : _.template($('#message-template').html()),
    
        // Constructor
        initialize : function(options) {
            _.bindAll(this, 'render');
            this.model.bind('all', this.render);
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
    
        // Render contents
        render : function() {
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);
            this.el.html(view);
            return this;
        }
    });
})(Views)