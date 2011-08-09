//    Backbone-DNode
//    (c) 2011 Beau Sorensen
//    Backbone-DNode may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/backbone-dnode

(function() {
    // Avatar middleware
    // -----------------
    
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this.
    var avatar = root.avatar;
    
    // Add to the main namespace with the Gravatar middleware
    // for DNode, accepts a socket client and connection
    avatar = function(client, con) {

    	//###gravatared
        // Fetched gravatar from the server, left as a 
        // placeholder for RPC delegations in case more work
        // needs to be done on the client before updating
        this.gravatared = function(resp, options) {
            if (!resp) return;
            options.finished && options.finished(resp);
        };
    };
    
    if (typeof root.avatar === 'undefined') root.avatar = avatar;
    if (typeof exports !== 'undefined') module.exports = avatar;

}).call(this)
