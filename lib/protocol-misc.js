// Miscellanious Procedures
// ------------------------

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    _        = require('underscore')._;
} else {
    this.Protocol = Protocol = {};
}

// The following are methods that the server may call to
Protocol = module.exports = function(client, con) {
    var self = this;
    
    _.extend(this, {
    
        // Start a conversation with another user
        startConversation : function(data, options, next) {
            console.log('startConversation: ', data);
            console.log('startConversation: ', options);
            
            // Required sorting params
            if (!options.id || !options.channel) {
                console.log('startConversation: INVALID ', data)
                options.error && options.error(400, data, options);
                return;
            }
            
            // Make sure we have a user to connection reference
            if (!onlineUsers[options.id]) {
                console.log('startConversation: NOT ONLINE ', onlineUsers);
                options.error && options.error(500, data, options);
                return;
            }
            
            // Check to see if the user is already subscribed
            if (Subscriptions[onlineUsers[options.id]].channels[options.channel]) {
            
                console.log('startConversation: SUBSCRIBED ', onlineUsers);
                return;
            }
            
            // Force client to take action
            Clients[options.id].startedConversation(data, options);
            
            // Calling user continuation
            next && next(data, options);
        }
    });
};