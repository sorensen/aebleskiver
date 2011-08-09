//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // Notification view
    // -----------------
    
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Views = root.Views;
    if (typeof Views === 'undefined') Views = root.Views = {};
    if (typeof exports !== 'undefined') module.exports = Views;
    
    // Single room message
    Views.NotificationView = Backbone.View.extend({
        
        // DOM attributes
        tagName   : 'div',
        className : 'notification',
        template  : _.template($('#notification-template').html()),
        
        // User interaction events
        events : {
            'click #remove-modal' : 'remove'
        },
    
        //###initialize
        // View constructor
        initialize : function(options) {
            _.bindAll(this, 'render');
            this.model.view = this;
        },
        
        //###remove
        // Remove this view from the DOM.
        remove : function() {
            $(this.el).remove();
        },
        
        //###render
        // Render contents
        render : function() {
            var content = this.model.toJSON(),
                view = Mustache.to_html(this.template(), content);
            
            $(this.el).html(view);
            
            // Post-formatting, done here as to prevent conflict
            // with Mustache HTML entity escapement
            this.$('.message').html(Helpers.linkify(content.text));
            return this;
        }
    });

}).call(this)
