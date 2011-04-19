(function(Models) {
    // User model
    // ------------------
    
    // User
    Models.UserModel = Backbone.Model.extend({
        
        urlRoot  : 'users',
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