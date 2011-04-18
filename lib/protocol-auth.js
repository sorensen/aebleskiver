(function() {
    // RPC Protocol
    // ----------------
    
    // Exports for CommonJS
    if (typeof exports !== 'undefined') {
        _        = require('underscore')._;
        Backbone = require('backbone');
        Keys     = require('keys');
        UUID     = require('node-uuid');
        Hash     = require('./hash');
    } else {
        this.Protocol = Protocol = {};
    }
    
    // Storage containers
    Store = new Keys.Memory();

    // Hashing salt
    var salt = "aebleskiver";
    
    // Online users container
    var online = {};
    
    // Check for buffered data
    var buffered = (Store instanceof Keys.Redis) ? false : true;
    
    // Define server-callable methods
    Protocol = module.exports = function(client, con) {
        var self = this;
        
        // Authenticate user with password
        this.authenticate = function(model, options, next) {
            console.log("Authenticate: ", JSON.stringify(model));
            console.log("Authenticate: ", JSON.stringify(options));
        
            if (!model || !options.password) {
                options.error && options.error(400, model, options);
                return;
            };
            var lookup = options.url + Hash.sha1(data.username, salt + data.username);
            
            console.log('auth key: ', lookup);
            
            // Check the store to make sure the requested user exists
            // before retrieving any user data
            Store.has(lookup, function(err, exists) {
                if (!exists) {
                    options.error && options.error(404, model, options);
                    return;
                } 
                else {
                    // Check password
                    Store.get(lookup, function(err, val) {
                        val = buffered ? val.toString('utf8') : val;
                        
                        var matched = Hash.sha1(options.password, salt + data.username);
                        if (matched !== val) {
                            options.error && options.error(401, model, options);
                            return;
                        } 
                        else {
                            var key = lookup + '.' + Hash.sha1(options.password, salt + data.username + 'public');
                            
                            // Retrieve public data to return to the client side, add the 
                            // current user to our list of 'online' users, and save it to 
                            // an express session or cookie to prevent user spoofing
                            Store.get(key, function(err, val) {
                                val = JSON.parse(buffered ? val.toString('utf8') : val);
                                
                                online[val.id] = val;
                                
                                // Remove the user from the 'online' container, and then 
                                // handle any other custom functions involving an unexpected
                                // client disconnection
                                con.on('end', function() {
                                    if (online[val.id]) delete online[val.id];
                                });
                                
                                client && client.authenticated(val, options);
                                next && next(val, options);
                            });
                        }
                    });
                }
            });
        };
        
        // Register a new user
        this.register = function(model, options, next) {
            console.log("Register: ", JSON.stringify(model));
            console.log("Register: ", JSON.stringify(options));
            
            if (!model.username || !options.password) {
                options.error && options.error(400, model, options);
                return;
            }
            var lookup = options.url + Hash.sha1(data.username, salt + data.username);
            
            // Check the data store for the supplied user before creating, 
            // so that we don't override another user's data
            Store.has(lookup, function(err, exists) {
                if (exists) {
                    options.error && options.error(401, model, options);
                    return;
                }
                
                // This will be the password to check against in the future
                var hashed = Hash.sha1(options.password, salt + data.username);
                Store.set(lookup, hashed, function() {
                
                    model.id = UUID();
                    var key = lookup + '.' + Hash.sha1(options.password, salt + data.username + 'public');
                    
                    // Save the user model under the 'public' space, sensitive information should 
                    // be identified here and put into the 'private' space so that it is not 
                    // returned to the client side
                    Store.set(key, JSON.stringify(model), function() {
                    
                        client && client.registered(model, options);
                        next && next(model, options);
                    });
                });
            });
        };
        
        // Restrict access to a client or server side function by 
        // requiring the supplied model to be in the 'online' users
        // and an express session or cookie to prevent XSS
        this.restricted = function(model, options, next) {
        
            // Check if the supplied user model has already
            // been added to the 'online' users array
            if (online[model.id]) {
                next && next(model, options);
                return;
            }
            
            // No user could be found, error handling to be 
            // delegated to the client side
            options.error && options.error(401, model, options);
            return;
        };
    };
})()