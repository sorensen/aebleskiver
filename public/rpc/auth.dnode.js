(function(ß) {
    // Backbone dnode sync
    // -------------------
    
    // Remote protocol
    ß.Protocols.Auth = function(client, con) {
    
        _.extend(this, {
        
            // User has been registered
            registered : function(resp, options) {
                options.finished && options.finished(resp);
            },
        
            // User has been authenticated
            authenticated : function(resp, options) {
                options.finished && options.finished(resp);
            }
        });
    };

})(ß)
