//  Aebleskiver
//  (c) 2011 Beau Sorensen
//  Backbone may be freely distributed under the MIT license.
//  For all details and documentation:
//  https://github.com/sorensen/aebleskiver

(function(ß) {
    // Message model
    // -------------
    
    // Single message model
    ß.Models.MessageModel = Backbone.Model.extend({
    
        type  : 'message',
        
        // Default model attributes
        defaults : {
            text     : '',
            username : '',
            avatar   : ''
        },
        
        // DNode persistence
        sync : _.sync,
        
        // Remove model along with the view
        clear : function() {
            this.view.remove();
        },
        
        // Client side validation, allowed to edit if user
        // created the message
        allowedToEdit : function(user) {
            return user.get('id') == this.get('user_id');
        },
        
        // Client side validation, all users can see all 
        // public messages
        allowedToView : function(user) {
            return true;
        }
    });
    
    ß.Models.PrivateMessageModel = ß.Models.MessageModel.extend({
    
        // Client side validation, only allowed to view message
        // if it was sent to or from the supplied user
        allowedToView : function(user) {
            return user.get('id') == this.get('to')
                || user.get('id') == this.get('user_id');
        }
        
    });
    
    // Message Collection
    ß.Models.MessageCollection = Backbone.Collection.extend({
        
        model : ß.Models.MessageModel,
        url   : 'messages',
        type  : 'message',
        
        // DNode persistence
        sync : _.sync,
        
        // Sort by 'created' time
        comparator : function(message) {
            return new Date(message.get('created')).getTime();
        }
    });

})(ß)