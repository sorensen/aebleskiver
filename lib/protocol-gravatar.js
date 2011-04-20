(function() {
    // RPC Gravatar Protocol
    // ---------------------
    
    // Exports for CommonJS
    if (typeof exports !== 'undefined') {
        gravatar = require('node-gravatar');
    } else {
        this.Protocol = Protocol = {};
    }
    
    // Define server-callable methods
    Protocol = module.exports = function(client, con) {
        var self = this;
        
        // Send current client data
        this.gravatar = function(options, next) {
            if (!options) return;
            
            // Grab a default gravatar if no email has been set
            options.email  || (options.email = 'mail@beausorensen.com');
            options.size   || (options.size = 120);
            options.rating || (options.rating = 'R');
            options.type   || (options.type = 'identicon');
            
            // Request image from the gravatar API
            image = gravatar.get(options.email, options.rating, options.size, options.type);
            
            client.gravatared(image, options);
            next && next(image, options);
        };
    };
    
})()