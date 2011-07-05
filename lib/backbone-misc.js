//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Miscellanious Procedures
// ------------------------

var Misc;
// Exports for CommonJS
if (typeof exports !== 'undefined') {
    _    = require('underscore')._;
}

// The following are methods that the server may call to
Misc = function(client, con) {
    _.extend(this, {
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
            // Calling user continuation
            next && next(data, options);
        }
    });
};

// The top-level namespace. All public classes and modules will
// be attached to this. Exported for both CommonJS and the browser.
if (typeof exports !== 'undefined') {
    module.exports = Misc;
} else {
    this.Misc = Misc;
}