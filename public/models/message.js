(function() {
    // Message model
    // ------------------
    var Models;
    
    if (typeof exports !== 'undefined') {
        _        = require('underscore')._;
        Backbone = require('backbone');
        Models   = exports;
    } else {
        if (!Models) var Models = this.Models = {};
        else _.extend(Models, this.Models);
    }
    
    // Message
    Models.MessageModel = Backbone.Model.extend({
        defaults : {
            created : true,
        },
        
        initialize : function(options) {
        },
        
        // Remove this delete its view.
        clear : function() {
            this.view.remove();
        },
    });
    
    // Message Collection
    Models.MessageCollection = Backbone.Collection.extend({
        
        model : Models.MessageModel,
        url   : 'messages',
        name  : 'messages',
        
        // Initialize
        initialize : function(options) {
        },
    });
    console.log('message', Models);
})()