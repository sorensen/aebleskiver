(function(Models) {
    // User model
    // ------------------
    
    // User
    Models.UserModel = Backbone.Model.extend({
        
        urlRoot  : 'users',
        name     : 'users',
        defaults : {
            'created' : true,
            'messages' : [],
            'username' : 'anonymous',
            'avatar'   : '/images/undefined.png',
            'status'   : 'offline',
            'statistics' : {
            },
        },
        
        initialize : function(options) {
        
        }
    });
    
    // User Collection
    Models.UserCollection = Backbone.Collection.extend({
        
        model : Models.UserModel,
        url   : 'users',
        name  : 'users',
        
        // Initialize
        initialize : function(options) {
        }
    });
    console.log('user', Models);
    
})(Models)