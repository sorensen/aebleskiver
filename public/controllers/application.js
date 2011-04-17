(function(Controllers) {
    // Application
    // ----------
    
    // Main controller and router
    Controllers.Application = Backbone.Controller.extend({
    
        // Definitions
        routes : {
            '/chats/:id' : 'joinChat',
            "*route"    : "invalid",
        },
        
        // Default action
        invalid : function(route) {
            console.log('Router: invalid: ', route);
            this.saveLocation('/');
        },
        
        // Join a chat room
        joinChat : function(id) {
            console.log('Router: join chat', id);
            if (!id) return;
            this.view.activateChat(id);
        },
        
        initialize : function(options) {
            this.saveLocation('/');
        
            // Create a new user for the current client, only the 
            // defaults will be used until the client authenticates
            // with valid credentials
            window.user = new Models.UserModel();
            
            // Attach the application
            Application = this.view = new Views.ApplicationView({
                // Use existing DOM element
                el : $("#wrapper")
            });
            
            // Circular reference
            this.view.controller = this;
            this.view.render();
        },
        
        // Authenticate the current user, check the credentials
        // sent on the server side, which will return the client 
        // data to update the default model with
        signin : function() {
        
            var params = {
                username : 'beau',
                password : 'sorensen',
                error    : generalError
            };
            Server.authenticate(window.user, params, function(resp) {
            
                console.log('window.user.authenticated: ', resp);
                
                // Update the current model with the returned data, 
                // increase total visits, and chage the status to 'online'
                window.user.set(resp);
                window.user.set({
                    visits : window.user.get('visits') + 1,
                    status : 'online',
                });
                
                // Request a gravatar image for the current 
                // user based on email address
                var params = {
                    email : window.user.get('email'),
                    size  : 40
                };
                
                Server.gravatar(params, function(resp) {
                    console.log('avatar', resp);
                    window.user.set({ avatar : resp });
                });
            });
        },
    });
    
})(Controllers)