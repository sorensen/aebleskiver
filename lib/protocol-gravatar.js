(function() {
    // RPC Gravatar Protocol
    // ----------------
    
    // Exports for CommonJS
    if (typeof exports !== 'undefined') {
        // Server
        gravatar = require('node-gravatar');
    } else {
        // Client
        this.Protocol = Protocol = {};
    }
        
    // Define server-callable methods
    Protocol = module.exports = function(client, con) {
        var self = this;
        
        // Send current client data
        this.gravatar = function(model, options, cb) {
            console.log('Gravatar: ', model);
                
            if (!model) return;
            
            // Grab a default gravatar if no email has been set
            if (!model.email) model.email = 'mail@beausorensen.com';
            if (model.email) {
            
                options.size = options.size || 120;
                options.rating = options.rating || 'R';
                options.type = options.type || 'identicon';
                
                // Grab mine if nothing else
                model.image = gravatar.get(model.email, options.rating, options.size, options.type);
                
                console.log('Gravatar: ', model);
                
                client.gravatared(model, options, cb);
                cb && cb(model, options);
            };
        };
    };
    
})()