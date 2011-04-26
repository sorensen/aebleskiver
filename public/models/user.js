(function(Models) {
    // User model
    // ------------------
    
    // User
    Models.UserModel = Backbone.Model.extend({
        
        type     : 'user',
        defaults : {
            created     : 'now',
            displayName : 'now',
            username    : 'anonymous',
            avatar      : '/images/undefined.png',
            status      : 'offline',
            messages    : [],
            statistics  : {},
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