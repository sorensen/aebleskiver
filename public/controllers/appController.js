(function(Controllers) {
    // Application
    // ----------
    
    // Main controller and router
    Controllers.Application = Backbone.Controller.extend({
    
        // Definitions
        routes : {
            '/rooms/:id' : 'joinRoom',
            '/signup'    : 'signup',
            '/login'     : 'login',
            '/'          : 'home',
            '*uri'       : 'invalid',
        },
        
        initialize : function(options) {
            
            // Force window location
            //this.saveLocation('/');
            
            // Attach the application
            Application = this.view = new Views.ApplicationView({
                // Use existing DOM element
                el : $("#application")
            });
            
            // Circular reference
            this.view.controller = this;
            this.view.render();
        },
        
        home : function() {
            this.view.render();
            this.view.deactivateRoom();
        },
        
        // Default action
        invalid : function(uri) {
            console.log('Router: invalid: ', uri);
            this.saveLocation('/');
        },
        
        // Join a room room
        joinRoom : function(id) {
        
            // Make sure that the room has been 
            // loaded by the application first
            this.view.activateRoom(id);
        },
        
        // Show the login form
        login : function() {
            this.view.showLogin();
        },
        
        // Show the login form
        signup : function() {
            this.view.showSignup();
        },
    });
    
})(Controllers)