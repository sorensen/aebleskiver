(function() {
    // Gravatar dnode sync
    // -------------------
    
    if (typeof exports !== 'undefined') {
		// Dependancies
        _         = require('underscore')._;
        Backbone  = require('backbone');
        DNode     = require('dnode');
        Gravatar  = module.exports;
    } else {
        Gravatar = this.Gravatar = {};
        Server   = this.Server = this.Gravatar.Server = Synchronize.Server || false;
    }
    
    var cb = function(){
        //TODO:
    };
    
    var connected = function(model, options) {
        console.log('Gravatar connected: ', model);
        console.log('Gravatar server: ', Server);
        
        Server.gravatar(model, options, cb);
    };
        
    // Transport methods for model storage, sending data 
    // through the socket instance to be saved on the Server 
    Gravatar = function(model, options) {
        options = options || {};
        
        // Remote protocol
        var GProtocol = function() {
        
            // Fetched gravatar
            this.gravatared = function(data, opt, cb) {
                console.log('Gravatared: ', data);
                // Compare URL's to update the right collection
                if (!data) return;
                
                opt.finished && opt.finished(data);
            };
        };
        
        // Connect to DNode Server only once
        if (!Server) DNode(GProtocol).connect(function(remote) {
            Server = remote;
            connected(model, options);
        });
        else connected(model, options);
    };
    //_.extend(Protocol, Gravatar);
    if (typeof exports !== 'undefined') module.exports = Gravatar;
})()