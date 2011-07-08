//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // Application
    // ----------
    
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Routers;
    if (typeof exports !== 'undefined') {
        Routers = exports;
    } else {
        Routers = this.Routers || (this.Routers = {});
    }
    
    // Main controller and router
    Routers.Application = Backbone.Router.extend({
    
        // Definitions
        routes : {
            '/rooms/:id' : 'joinRoom',
            '/users/:id' : 'viewProfile',
            '/signup'    : 'signup',
            '/login'     : 'login',
            '/'          : 'home',
            '*uri'       : 'invalid',
        },
        
        initialize : function(options) {
            
            // Attach the application
            this.view = new Views.ApplicationView({
                // Use existing DOM element
                el : $('#application')
            });
            
            // Circular reference
            this.view.controller = this;
            this.view.statistics();
        },
        
        home : function() {
            this.view.statistics();
            this.view.deactivateRoom();
        },
        
        // Default action
        invalid : function(uri) {
            this.saveLocation('/');
        },
        
        // Join a room room
        joinRoom : function(id) {
        
            // Make sure that the room has been 
            // loaded by the application first
            this.view.activateRoom(id);
        },
        
        // View a user profile
        viewProfile : function(id) {
        
            // Make sure that the room has been 
            // loaded by the application first
            this.view.activateUser(id);
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
})()