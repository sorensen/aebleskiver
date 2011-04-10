(function(Models) {
    // Application model
    // -----------------
    
    // World Model
    Models.ApplicationModel = Backbone.Model.extend({
    
        name     : 'application',
        urlRoot  : 'app',
        
        defaults : {
            'visits'  : 0,
            'users'   : [],
            'chats'   : []
        },
        
        initialize : function(options) {
            // Current user collection
            this.users = new Models.UserCollection();
            this.users.url = 'app:' + this.id + ':users';
            
            // Active chat collection
            this.chats = new Models.ChatCollection();
            this.chats.url = 'app:' + this.id + ':chats';
        }
    });
    
})(Models)