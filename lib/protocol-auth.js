// RPC Protocol
// ----------------

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    _            = require('underscore')._;
    Backbone     = require('backbone');
    Keys         = require('keys');
    UUID         = require('node-uuid');
    Hash         = require('./hash');
    connect      = require('connect');
    SessionStore = require('connect-redis');
} else {
    this.Protocol = Protocol = {};
}

// Redis session store
var Session = new SessionStore;

// Storage containers
Store = new Keys.Redis();

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
        
        console.log('authenticate model: ', model);
        console.log('authenticate options: ', options);
        
        model.username || (model.username = options.username);
        
        
        var params = _.extend({
            username : model.username,
            url      : 'users:',
            silent   : true,
        }, options);
        
        this.read(model, params, function(resp) {
        
            console.log('auth read', resp);
            // Set the private lookup key
            var lookup = 'users.sensitive:' + Hash.sha1(options.username, salt + resp.id);
        
        });
        
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
                    
                    // Set the model to the session for temporary data 
                    // changes and lookup on refresh
                    options.token && self.setUser(val, options);
                    
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
            
        // Set the new username from the default
        model.username = options.username;
        
        var params = _.extend({
            url    : 'users:',
            silent : true,
        }, options);
        
        this.create(model, params, function(resp) {
        
            // Set the private lookup key
            var lookup = 'users.sensitive:' + Hash.sha1(options.username, salt + resp.id);
            var sensitive = {
                password : Hash.sha1(options.password, salt + resp.id),
            };
            
            // Check the data store for the supplied user before creating, 
            // so that we don't override another user's data
            Store.has(lookup, function(err, exists) {
                
                // The key should not exist, since we shouldn't have made it this far
                // without a newly created user model via CRUD
                if (exists) return (options.error && options.error(500, model, options));
                
                Store.set(lookup, JSON.stringify(sensitive), function() {
                    
                    // Set the model to the session for temporary data 
                    // changes and lookup on refresh
                    options.token && self.setSession(model, options);
                    
                    client && client.registered(model, options);
                    next && next(model, options);
                });
            });
            
        });
    };
    
    // Register a new user
    this.getSession = function(model, options, next) {
        if (!model || !options.token)
            return (options.error && options.error(400, model, options));
            
        console.log('getSession: model: ', model);
        console.log('getSession: options: ', options);
        
        Session.get(options.token, function (err, data) {
            console.log('session: ', data);
            
            // Check for session
            if (!data) return;
            if (!data.user) {
                // Assign default user a temporary id
                //model.id || (model.id = Hash.md5(UUID()));
                self.setSession(model, options);
                
                data.user = model;
                
                Session.set(options.token, data, function(err) {
                
                    //client.receiveUser(data, options);
                    next && next(data, options);
                    
                });
            } 
            else {
                // Existing session found
                //client.receiveUser(data, options);
                next && next(data, options);
            }
        });
        
    };
    
    // Register a new user
    this.setSession = function(model, options, next) {
        if (!model || !options.token)
            return (options.error && options.error(400, model, options));
            
        console.log('setUser', model);
        console.log('setUser', options);
        
        Session.get(options.token, function (err, data) {
        
            // Assign default user a temporary id
            //model.id || (model.id = Hash.md5(UUID()));
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