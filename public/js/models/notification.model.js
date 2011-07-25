//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

//(function() {
    // Notification model
    // ------------------
    
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Models = root.Models;
    if (typeof Models === 'undefined') Models = root.Models = {};
    if (typeof exports !== 'undefined') module.exports = Models;
    
    //##NotificationModel
    // Default model for any generic user notifications
    // the application may need to send, used for consistancy
    Models.NotificationModel = Backbone.Model.extend({
    
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
    Models.NotificationCollection = Backbone.Collection.extend({
        
        // Server communication settings
        model : Models.NotificationModel,
        url   : 'messages',
        type  : 'message',
        sync  : function() {},
        
        //###comparator
        // Sort based on 'created' time
        comparator : function(message) {
            return new Date(message.get('created')).getTime();
        }
    });
//})();
