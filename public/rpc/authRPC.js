(function(Protocols) {
    // Backbone dnode sync
    // -------------------
    
    // Remote protocol
    Protocols.Auth = function(client, con) {
    
        _.extend(this, {
        
            // User has been registered
            registered : function(resp, options) {
                //console.log('registered: ', resp);
                //console.log('registered: ', options);
                
                options.finished && options.finished(resp);
            },
        
            // User has been authenticated
            authenticated : function(resp, options) {
                //console.log('authenticated: ', resp);
                //console.log('authenticated: ', options);
                
                options.finished && options.finished(resp);
            }
        });
    };

})(Protocols)
