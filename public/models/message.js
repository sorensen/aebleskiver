(function(Models) {
    // Message model
    // ------------------
    
    // Single message model
    Models.MessageModel = Backbone.Model.extend({
    
        // Default model attributes
        defaults : {
            created : true,
        },
        
        // Constructor
        initialize : function(options) {
        },
        
        // Remove model along with the view
        clear : function() {
            this.view.remove();
        },
    });
    
    // Message Collection
    Models.MessageCollection = Backbone.Collection.extend({
        
        model : Models.MessageModel,
        url   : 'messages',
        
        // Constructor
        initialize : function(options) {
        },
    });
})(Models)