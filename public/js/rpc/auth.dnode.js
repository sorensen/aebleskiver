//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // Authentication Middleware
    // -------------------------
    
    // Save a reference to the global object.
    var root = this;
    
    // Require Underscore, if we're on the server, and it's not already present.
    var _ = root._;
    if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;

    // The top-level namespace. All public classes and modules will
    // be attached to this. 
    var auth = root.auth;
    
    // Add to the main namespace with the Auth middleware
    // for DNode, accepts a socket client and connection
    auth = function(client, con) {
        _.extend(this, {
        
            //###registered
            // User has been registered on the server
            registered : function(resp, options) {
                options.finished && options.finished(resp);
            },
        
            //###authenticated
            // User has been authenticated on the server
            authenticated : function(resp, options) {
                options.finished && options.finished(resp);
            }
        });
    };
    
    if (typeof root.auth === 'undefined') root.auth = auth;
    if (typeof exports !== 'undefined') module.exports = auth;

}).call(this)
