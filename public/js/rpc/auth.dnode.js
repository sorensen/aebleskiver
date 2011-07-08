//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // Authentication Middleware
    // -------------------------
    
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Auth;
    if (typeof exports !== 'undefined') {
        Auth = exports;
    }
    
    // Add to the main namespace with the Auth middleware
    // for DNode, accepts a socket client and connection
    Auth = function(client, con) {
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
    
    // CommonJS browser export
    if (typeof exports === 'undefined') {
        this.Auth = Auth;
    }
})()
