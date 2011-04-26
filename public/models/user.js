(function(Models) {
    // User model
    // ------------------
    
    // User
    Models.UserModel = Backbone.Model.extend({
        
        type     : 'user',
        defaults : {
            'displayName' : false,
            'username'    : 'anonymous',
            'avatar'      : '/images/undefined.png',
            'status'      : 'offline',
            'created'     : true,
            'messages'    : [],
            'statistics'  : {
            },
        },
        
        // Labels for sensitive information
        sensitive : [
            'password',
            'email'
        ],
        
        initialize : function(options) {
        
        }
    });
    
    // User Collection
    Models.UserCollection = Backbone.Collection.extend({
        
        model : Models.UserModel,
        url   : 'users',
        
        // Initialize
        initialize : function(options) {
        }
    });
})(Models)