(function(ß) {
    // Notification model
    // ------------------
    
    // Single message model
    ß.Models.NotificationModel = Backbone.Model.extend({
    
        type  : 'notification',
        
        // Default model attributes
        defaults : {
            type : 'notice'
        },
        
        // Constructor
        initialize : function(options) {
        },
        
        // No persistance
        sync : function() {
        
        }
    });
    
    // Message Collection
    ß.Models.NotificationCollection = Backbone.Collection.extend({
        
        model : ß.Models.NotificationModel,
        url   : 'messages',
        type  : 'message',
        
        // Sort by 'created' time
        comparator : function(message) {
            return new Date(message.get('created')).getTime();
        },
        
        // No persistance
        sync : function() {
        
        }
    });

})(ß)