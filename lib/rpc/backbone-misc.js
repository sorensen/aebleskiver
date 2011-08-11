//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Miscellaneous middleware
// ------------------------

// Save a reference to the global object.
var root = this;

// Create the top level namespaced object
var Misc;

// Require Underscore, if we're on the server, and it's not already present.
var _ = root._;
if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;
    
// Add to the main namespace with the Misc middleware
// for DNode, accepts a socket client and connection
Misc = function(client, con) {
    _.extend(this, {
    
        //###startConversation
        // Start a conversation with another user
        startConversation : function(data, options, next) {
            // Required sorting params
            if (!options.id || !options.channel) {
                options.error && options.error(400, data, options);
                return;
            }
            // Check to see if the user is already subscribed
            if (onlineUsers[options.id] && !Subscriptions[onlineUsers[options.id]].channels[options.channel]) {
                // Force client to take action
                Clients[onlineUsers[options.id]].startedConversation(data, options);
            }
            next && next(data, options);
        }
    });
};

// The top-level namespace. All public classes and modules will
// be attached to this. Exported for both CommonJS and the browser.
if (typeof exports !== 'undefined') {
    module.exports = Misc;
} else {
    root.Misc = Misc;
}