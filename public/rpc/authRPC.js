(function(Protocols) {
    // Backbone dnode sync
    // -------------------
    
    // Remote protocol
    Protocols.Auth = function(client, con) {
    
        // New subscription
        _.extend(this, {
            registered : function(resp, options) {
                console.log('registered: ', resp);
                console.log('registered: ', options);
                
                options.finished && options.finished(resp);
            },
        
            // New subscription
            authenticated : function(resp, options) {
                console.log('authenticated: ', resp);
                console.log('authenticated: ', options);
                
                options.finished && options.finished(resp);
            }
        });
    };

})(Protocols)