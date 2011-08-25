//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Application Router
// ------------------

(function() {
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Routers = root.Routers;
    if (typeof Routers === 'undefined') Routers = root.Routers = {};
    if (typeof exports !== 'undefined') module.exports = Routers;
    
    // Main controller and router
    Routers.Application = Backbone.Router.extend({
    
        //###routes
        // Definitions
        routes : {
            '/rooms/:id' : 'joinRoom',
            '/users/:id' : 'viewProfile',
            '/signup'    : 'signup',
            '/login'     : 'login',
            '/'          : 'home',
            '*uri'       : 'invalid',
        },
        
        //###initialize
        initialize : function(options) {
            this.view = new Views.ApplicationView({
                el : $('#application')
            });
            this.view.router = this;
        },
        
        //###home
        home : function() {
            this.view.home();
        },
        
        //###invalid
        // Default action
        invalid : function(uri) {
            this.navigate('/', true);
        },
        
        //###joinRoom
        // Join a room, make sure that the room has been 
        // loaded by the application first
        joinRoom : function(slug) {
            this.view.notHome();
            this.view.activateRoom(slug);
        },
        
        //###viewProfile
        // View a user profile, make sure that the room has been 
        // loaded by the application first
        viewProfile : function(slug) {
            this.view.notHome();
            this.view.activateUser(slug);
        }
    });

}).call(this)
