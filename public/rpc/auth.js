(function(Protocols) {
    // Backbone dnode sync
    // -------------------
    
    // Remote protocol
    Protocols.Auth = function(client, con) {
    
        // New subscription
        this.registered = function(resp, options) {
            console.log('registered: ', resp);
            console.log('registered: ', options);
            
            options.finished && options.finished(resp);
        };
    
        // New subscription
        this.authenticated = function(resp, options) {
            console.log('authenticated: ', resp);
            console.log('authenticated: ', options);
            
            options.finished && options.finished(resp);
        };
    };
})(Protocols)