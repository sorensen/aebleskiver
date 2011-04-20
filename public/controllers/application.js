(function(Controllers) {
    // Application
    // ----------
    
    // Main controller and router
    Controllers.Application = Backbone.Controller.extend({
    
        // Definitions
        routes : {
            '/signup'    : 'signup',
            '/login'     : 'login',
            '/logout'    : 'logout',
            '/rooms/:id' : 'joinRoom',
            '/'          : 'home',
            '*route'     : 'invalid',
        },
        
        // Default action
        invalid : function(route) {
            console.log('Router: invalid: ', route);
            this.saveLocation('/');
        },
        
        // Join a room room
        joinRoom : function(id) {
            if (!id) return;
            this.view.activateRoom(id);
        },
        
        home : function() {
            this.view.render();
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
                el : $("#application")
            });
            
            // Circular reference
            this.view.controller = this;
            this.view.render();
        },
        
        // Show the login form
        login : function() {
            this.view.showLogin();
        },
        
        // Destroy the current user object
        logout : function() {
            delete window.user;
            window.user = new Models.UserModel();
        },
        
        // Show the login form
        signup : function() {
            this.view.showSignup();
        },
    });
    
})(Controllers)