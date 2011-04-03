(function(){
    // Client
    // ------------------
    require.paths.unshift(__dirname + '/lib');
    
    // Dependancies
    var dnode         = require('dnode'),
        _             = require('underscore')._,
        Backbone      = require('backbone'),
        Synchronize   = require('./public/synchronize'),
        Models        = require('./public/models/models');
    
    // Remote protocol
    var Protocol = function() {
        // Created model            
        this.created = function(data, opt, cb) {
            console.log('RPC:created: ', JSON.stringify(data));
        };
        
        // Fetched model
        this.read = function(data, opt, cb) {
            console.log('RPC:read: ', JSON.stringify(data));
        };
        
        // Updated model data
        this.updated = function(data, opt, cb) {
            console.log('RPC:updated: ', JSON.stringify(data));
        };
        
        // Destroyed model
        this.destroyed = function(data, opt, cb) {
            console.log('RPC:destroyed: ', JSON.stringify(data));
        };
        
        // Destroyed model
        this.published = function(data, opt, cb) {
            console.log('RPC:published: ', JSON.stringify(data));
        };
    };
    
    // Initialize DNode
    dnode(Protocol).connect(8080, function(remote) {
        
        var users = new Models.UserCollection({url : 'users'});
        
        //remote.subscribe(users.toJSON());
        
        Synchronize(users, {fetch : true});
        
    });
})()