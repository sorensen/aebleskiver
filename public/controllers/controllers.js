(function() {
    // Controller
    // ----------
    
    // Configure backbone settings and define 
    // the application routing.
    var Controllers;
    if (typeof exports !== 'undefined') {
        _           = require('underscore')._;
        Backbone    = require('backbone');
        Controllers = exports;
    } else {
        Controllers = this.Controllers = {};
    }    
    
    // Router
    Controllers.Workspace = Backbone.Controller.extend({
    
        // Definitions
        routes : {
            '/chats/:id' : 'joinChat',
            "/*route"    : "action",
            "*route"    : "invalid",
        },
        
        // Default action
        invalid : function(route) {
            console.log('Router: invalid: ', route);
            //TODO: something
        },
        
        // Join a chat room
        joinChat : function(id) {
            console.log('Router: join chat', id);
            if (!id) return;
            this.view.activateChat(id);
        },
        
        initialize : function(options) {
        
            // Attach the application
            Application = this.view = new Views.ApplicationView({
                // Use existing DOM element
                el : $("#wrapper")
            });
            
            // Circular reference
            this.view.controller = this;
        },
    });
})()