// RPC Protocol
// ----------------

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    _        = require('underscore')._;
    Backbone = require('backbone');
    Keys     = require('keys');
    UUID     = require('node-uuid');
    Hash     = require('./hash');
    connect  = require('connect');
    SessionStore = require('connect-redis');
} else {
    this.Protocol = Protocol = {};
}

// Redis session store
var Session = new SessionStore;

// Storage containers
Store = new Keys.Redis();
Store.clear();

// Hashing salt
var salt = "aebleskiver";

// Online users container
var online = {};

// Check for buffered data
var buffered = (Store instanceof Keys.Redis) ? false : true;

// Define server-callable methods
Protocol = module.exports = function(client, con) {
    var self = this;
    
    // Client connected
    con.on('ready', function() {
        console.log('auth conn', con.id);
    });
    
    // Authenticate user with password
    this.authenticate = function(model, options, next) {
        if (!model || !options.password)
            return (options.error && options.error(400, model, options));
        
        var lookup = 'users:' + Hash.sha1(options.username, salt + options.username);
        model.username || (model.username = options.username);
        
        // Check the store to make sure the requested user exists
        // before retrieving any user data
        Store.has(lookup, function(err, exists) {
            if (!exists)
                return (options.error && options.error(404, model, options));
            
            // Check password
            Store.get(lookup, function(err, val) {
                val = buffered ? val.toString('utf8') : val;
                
                var matched = Hash.sha1(options.password, salt + options.username);
                if (matched !== val)
                    return (options.error && options.error(401, model, options));
                
                var key = lookup + '.' + Hash.sha1(options.password, salt + options.username + 'public');
                
                // Retrieve public data to return to the client side, add the 
                // current user to our list of 'online' users, and save it to 
                // an express session or cookie to prevent user spoofing
                Store.get(key, function(err, val) {
                
                    val = JSON.parse(buffered ? val.toString('utf8') : val);
                    
                    online[val.id] = val;
                    
                
                    // Set the model to the session for temporary data 
                    // changes and lookup on refresh
                    options.token && self.setUser(val, options);
                    
                    // Remove the user from the 'online' container, and then 
                    // handle any other custom functions involving an unexpected
                    // client disconnection
                    con.on('end', function() {
                        if (online[val.id]) delete online[val.id];
                    });
                    
                    client && client.authenticated(val, options);
                    next && next(val, options);
                });
            });
        });
    };
    
    // Register a new user
    this.register = function(model, options, next) {
        if (!options.username || !options.password)
            return (options.error && options.error(400, model, options));
        
        var lookup = 'users:' + Hash.sha1(options.username, salt + options.username);
        
        // Set the new username from the default
        model.username = options.username;
        
        // Check the data store for the supplied user before creating, 
        // so that we don't override another user's data
        Store.has(lookup, function(err, exists) {
            if (exists) 
                return (options.error && options.error(401, model, options));
            
            // This will be the password to check against in the future
            var hashed = Hash.sha1(options.password, salt + options.username);
            Store.set(lookup, hashed, function() {
            
                // Set the created timestamp if one is supplied
                model.created && (model.created = new Date().getTime());
                model.id = Hash.md5(UUID(), salt);
                
                
                var key = lookup + '.' + Hash.sha1(options.password, salt + options.username + 'public');
                
                // Save the user model under the 'public' space, sensitive information should 
                // be identified here and put into the 'private' space so that it is not 
                // returned to the client side
                Store.set(key, JSON.stringify(model), function() {
                
                    // Set the model to the session for temporary data 
                    // changes and lookup on refresh
                    options.token && self.setUser(model, options);
                    
                    client && client.registered(model, options);
                    next && next(model, options);
                });
            });
        });
    };
    
    // Register a new user
    this.getUser = function(model, options, next) {
        if (!model || !options.token)
            return (options.error && options.error(400, model, options));
            
        console.log('getUser', model);
        console.log('getUser', options);
        
        Session.get(options.token, function (err, data) {
            console.log('session data', data);
            
            // Check for session
            if (!data) return;
            if (!data.user) {
                // Assign default user a temporary id
                model.id || (model.id = Hash.md5(UUID()));
                self.setUser(model, options, next);
            } 
            else {
                // Existing session found
                //client.receiveUser(data, options);
                next && next(data, options);
            }
        });
        
    };
    
    // Register a new user
    this.setUser = function(model, options, next) {
        if (!model || !options.token)
            return (options.error && options.error(400, model, options));
            
        console.log('setUser', model);
        console.log('setUser', options);
        
        Session.get(options.token, function (err, data) {
        
            // Assign default user a temporary id
            model.id || (model.id = Hash.md5(UUID()));
            data.user = model;
            
            Session.set(options.token, data, function(err) {
            
                //client.receiveUser(data, options);
                next && next(data, options);
                
            });
        });
        
    };
    
    // Log the current user out, removing their cookie if found
    // and notifying everyone of the disconnect for view updates
    this.logout = function(model, options, next) {
    
        // Destroy current session if token provided
        if (options.token) {
            Session.destroy(options.token);
        }
    
        // Check if the supplied user model has already
        // been added to the 'online' users array
        if (online[model.id]) {
        
            // Notify all other channel subscribers that a new 
            // connection has been made
            _.each(Clients, function(cid, someone) {
                //someone.loggedOut(model, options);
            });
        
            next && next(model, options);
            return;
        }
        
        // No user could be found, error handling to be 
        // delegated to the client side
        options.error && options.error(401, model, options);
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
    };
};