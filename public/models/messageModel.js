(function(Models) {
    // Message model
    // ------------------
    
    // Single message model
    Models.MessageModel = Backbone.Model.extend({
    
        type  : 'message',
        
        // Default model attributes
        defaults : {
            text     : '',
            username : '',
            avatar   : ''
        },
        
        // Constructor
        initialize : function(options) {
        },
        
        // Remove model along with the view
        clear : function() {
            this.view.remove();
        },
        
        allowedToEdit : function(user) {
            return user.get('id') == this.get('user_id');
        },
        
        allowedToView : function(user) {
            return true;
        }
    });
    
    Models.PrivateMessageModel = Models.MessageModel.extend({
    
        allowedToView : function(user) {
            return user.get('id') == this.get('to')
                || user.get('id') == this.get('user_id');
        }
        
    });
    
    // Message Collection
    Models.MessageCollection = Backbone.Collection.extend({
        
        model : Models.MessageModel,
        url   : 'messages',
        type  : 'message',
        
        // Constructor
        initialize : function(options) {
        },
        
        comparator : function(message) {
            return new Date(message.get('created')).getTime();
        }
    });

})(Models)