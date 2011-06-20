(function(ß) {
    // Notification view
    // -----------------
    
    // Single room message
    ß.Views.NotificationView = Backbone.View.extend({
        
        // DOM attributes
        tagName   : 'div',
        className : 'notification',
        template  : _.template($('#notification-template').html()),
        
        
        events : {
            'click #remove-modal' : 'remove'
        },
    
        // Constructor
        initialize : function(options) {
            _.bindAll(this, 'render');
            this.model.view = this;
        },
        
        // Remove this view from the DOM.
        remove : function() {
            $(this.el).remove();
        },
    
        // Render contents
        render : function() {
            var content = this.model.toJSON(),
                view = Mustache.to_html(this.template(), content);
            
            $(this.el).html(view);
            
            // Post-formatting, done here as to prevent conflict
            // with Mustache HTML entity escapement
            this.$('.message')
                .html(ß.Helpers.linkify(content.text));
            
            return this;
        }
    });

})(ß)
