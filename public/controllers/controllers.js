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
    Controllers.Router = Backbone.Controller.extend({
    
        // Definitions
        routes : {
            "/*route" : "action",
        },
        
        // Actions
        action : function(route) {
            //TODO: something
        },
    });
})()