//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // Message models
    // --------------
    
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Models;
    if (typeof exports !== 'undefined') {
        module.exports = Models;
    } else {
        Models = root.Models || (root.Models = {});
    }
    
    //##MessageModel
    // Basic message type used for every generic room
    // and user profile, also serving as a 'base' model
    Models.MessageModel = Backbone.Model.extend({
    
        // Server communication settings
        type : 'message',
        sync : _.sync,
        
        // Default model attributes
        defaults : {
            text     : '',
            username : '',
            avatar   : ''
        },
        
        //###clear
        // Remove model along with the view
        clear : function() {
            this.view.remove();
        },
        
        //###allowedToEdit
        // Client side validation, allowed to edit if user
        // created the message
        allowedToEdit : function(user) {
            return user.get('id') == this.get('user_id');
        },
        
        //###allowedToView
        // Client side validation, all users can see all 
        // public messages
        allowedToView : function(user) {
            return true;
        }
    });
    
    //##PrivateMessageModel
    // Extention of the base message type, used in private
    // conversations between users
    Models.PrivateMessageModel = Models.MessageModel.extend({
    
        //###allowedToView
        // Client side validation, only allowed to view message
        // if it was sent to or from the supplied user
        allowedToView : function(user) {
            return user.get('id') == this.get('to')
                || user.get('id') == this.get('user_id');
        }
        
    });
    
    //##MessageCollection
    // Main container for all message based models to be stored
    // in, provides server transport settings and events
    Models.MessageCollection = Backbone.Collection.extend({
        
        // Server communication settings
        model : Models.MessageModel,
        url   : 'messages',
        type  : 'message',
        sync  : _.sync,
        
        //###comparator
        // Sort by 'created' time
        comparator : function(message) {
            return new Date(message.get('created')).getTime();
        }
    });

})()