//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function(ß) {
    // Message models
    // --------------
    
    // Extend the Backbone 'model' object and add it to the 
    // namespaced model container with each message model
    
    //##MessageModel
    // Basic message type used for every generic room
    // and user profile, also serving as a 'base' model
    ß.Models.MessageModel = Backbone.Model.extend({
    
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
    ß.Models.PrivateMessageModel = ß.Models.MessageModel.extend({
    
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
    ß.Models.MessageCollection = Backbone.Collection.extend({
        
        // Server communication settings
        model : ß.Models.MessageModel,
        url   : 'messages',
        type  : 'message',
        sync  : _.sync,
        
        //###comparator
        // Sort by 'created' time
        comparator : function(message) {
            return new Date(message.get('created')).getTime();
        }
    });

})(ß)