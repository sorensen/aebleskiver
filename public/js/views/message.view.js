//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

//(function() {
    // Message view
    // ------------
    
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Views = root.Views;
    if (typeof Views === 'undefined') Views = root.Views = {};
    if (typeof exports !== 'undefined') module.exports = Views;
    
    //##MessageView
    // Single room message
    Views.MessageView = Backbone.View.extend({
        
        // DOM attributes
        tagName   : 'li',
        className : 'message',
        
        //###Templates
        // Predefined markdown templates for dynamic rendering
        template  : _.template($('#message-template').html()),
    
        //###initialize
        // View constructor
        initialize : function(options) {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
            this.model.view = this;
        },
        
        //###remove
        // Remove this view from the DOM.
        remove : function() {
            $(this.el).remove();
        },
    
        //###render
        // Create the DOM element to represent the view, passing 
        // data through mustache, and applying all UI formatting
        render : function() {
            var content = this.model.toJSON();
            
            // Switch name and ID for an anonymous user, they can only be 
            // looked up via session id, instead of username
            if (content.username === 'anonymous') {
                content.displayName || (content.displayName = content.username);
                content.username = content.user_id;
            }
            
            // Pre-formatting 
            content.text = this.model.escape('text');
            content.created && (content.created = _.timeFormat(content.created));
            
            var view = Mustache.to_html(this.template(), content);
            $(this.el).html(view);
            
            this.model.concurrent && $(this.el).addClass('concurrent');
            
            // Post-formatting, done here as to prevent conflict
            // with Mustache HTML entity escapement
            this.$('.data')
                .html(_.linkify(content.text))
                .emoticonize({
                    //delay   : 800,
                    //animate : false
                    //exclude : 'pre, code, .no-emoticons'
                });
            
            // Set this as a preference
            //this.$('.timeago').timeago();
            return this;
        }
    });
//})();
