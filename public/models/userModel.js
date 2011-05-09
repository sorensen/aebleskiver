(function(Models) {
    // User model
    // ------------------
    
    // User
    Models.UserModel = Backbone.Model.extend({
        
        type     : 'user',
        defaults : {
            username : 'anonymous',
            avatar   : '/images/undefined.png',
            status   : 'offline'
        },
        
        initialize : function(options) {
            console.log('User init: ', options);
            console.log('User init: ', this);
        },
        
        // Authenticate the current user model
        authenticate : function(data, options, next) {
        
            var self = this;
            options.type = this.type;
            
            // Update the current model with the returned data, 
            // increase total visits, and chage the status to 'online'
            Server.authenticate(data, options, function(resp) {
                
                console.log('authenticated: ', resp);
                
                self.set(resp);
                self.set({
                    visits : self.get('visits') + 1,
                    status : 'online',
                });
                
                // Request a gravatar image for the current 
                // user based on email address
                var params = {
                    email : self.get('email'),
                    size  : 40
                };
                
                Server.gravatar(params, function(resp) {
                    self.set({ avatar : resp });
                });
                
                next && next(resp);
            });
        },
        
        // Register model with the server
        register : function(data, options, next) {
        
            var self = this;
            options.type = this.type;
            
            // Update the current model with the returned data, 
            // increase total visits, and chage the status to 'online'
            Server.register(data, options, function(resp) {
                console.log('model register: ', resp);
                self.set(resp);
                self.set({
                    visits : self.get('visits') + 1,
                    status : 'online',
                });
                
                // Request a gravatar image for the current 
                // user based on email address
                var params = {
                    email : self.get('email'),
                    size  : 40
                };
                
                Server.gravatar(params, function(resp) {
                    self.set({ avatar : resp });
                });
                
                next && next(resp);
            });
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            this.messages && this.messages.unsubscribe();
        },
    });
    
    // User Collection
    Models.UserCollection = Backbone.Collection.extend({
        
        model : Models.UserModel,
        type  : 'user',
        url   : 'users',
        
        // Initialize
        initialize : function(options) {
            console.log('User collection init: ', options);
        }
    });

})(Models)