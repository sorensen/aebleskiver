//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function(ß) {
    // Notification model
    // ------------------
    
    //##NotificationModel
    // Default model for any generic user notifications
    // the application may need to send, used for consistancy
    ß.Models.NotificationModel = Backbone.Model.extend({
    
        // Server communication settings
        type : 'notification',
        sync : function() {},
        
        // Default model attributes
        defaults : {
            type : 'notice'
        }
    });
    
    //##NotificationCollection
    // Container to store or group notification models, 
    // as well as propegate events
    ß.Models.NotificationCollection = Backbone.Collection.extend({
        
        // Server communication settings
        model : ß.Models.NotificationModel,
        url   : 'messages',
        type  : 'message',
        sync  : function() {},
        
        //###comparator
        // Sort based on 'created' time
        comparator : function(message) {
            return new Date(message.get('created')).getTime();
        }
    });

})(ß)