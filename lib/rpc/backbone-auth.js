//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Authentication middleware
// -------------------------

// Save a reference to the global object.
var root = this;

// Create the top level namespaced object
var Auth;

// Require Underscore, if we're on the server, and it's not already present.
var _ = root._;
if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;

// Mongoose connection reference
var database;

// Express session store
var Store;

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    bcrypt = require('bcrypt'),
    UUID   = require('node-uuid'),
    Hash   = require('../../vendor/hash')
}

// Add to the module exports for DNode middleware, 
// accepts a socket client and connection
Auth = function(client, con) {
    var self    = this,
        User    = database.model('user'),
        Session = database.model('session');

    _.extend(this, {
    
        //###authenticate
        // Authenticate user with password
        authenticate : function(data, options, next) {
            if (!data.username || !data.password)
                return (options.error && options.error(400, data, options));

            console.log('authenticate options: ', data);
            console.log('authenticate options: ', options);
            
            var query = {
                username : data.username
            };
            User.findOne(query, function(error, doc) {
                if (error) {
                    console.log('Auth Error: ', error);
                    return (options.error && options.error(500, data, options));
                }
                if (!doc) {
                    console.log('Auth 404: ', error);
                    options.error && options.error(404, data, options);
                    return;
                }
                
                console.log('Authentication doc: ', doc);
            
                if (doc.authenticate(data.password)) {
                    //doc.password = data.password;
                    console.log('Authentication Good: ');
                    doc.status = 'online';
                    var parsed = JSON.parse(JSON.stringify(doc));
                    
                    var params = _.extend({
                        channel : 'app:users',
                        method  : 'create'
                    }, options);
                
                    // Remove user on disconnect
                    con.on('end', function() {
                        console.log('auth disconnect');
                        doc.status = 'offline';
                        doc.save(function(error) {
                            if (error) {
                                console.log('Auth End Error: ', error);
                            }
                            console.log('Doc Saved');
                            var reparsed = JSON.parse(JSON.stringify(doc));
                            params.method = 'update';
                            self.publish(reparsed, params);
                        });
                    });
                    
                    doc.save(function(error) {
                        if (error) {
                            console.log('User Online Error: ', error);
                        }
                        client.read(parsed, params);
                        self.publish(parsed, params);
                        options.token && self.setSession(_.extend(parsed, {
                            //password : data.password
                        }), options);
                    });
                    client && client.authenticated(parsed, options);
                    next && next(parsed, options);
                }
                else {
                    return (options.error && options.error(401, data, options));
                }
            });
        },
    
        //###register
        // Register a new user
        register : function(data, options, next) {
            console.log('register: ', JSON.stringify(data));
            console.log('register: ', JSON.stringify(options));
            
            if (!data.username || !data.password)
                return (options.error && options.error(400, data, options));
            
            // Direct user model interface
            var instance = new User(data);
            
            console.log('register instance: ', instance);
            
            instance.save(function (err) {
                if (err) console.log('REG ERROR:', err);
                if (err) return (options.error && options.error(500, data, options));;
                
                console.log('register instance: ', instance);
                var parsed = JSON.parse(JSON.stringify(instance));
                
                var params = _.extend({
                    channel : 'app:users',
                    method  : 'create'
                }, options);
            
                // Remove user on disconnect
                con.on('end', function() {
                    console.log('registration disconnect');
                    instance.status = 'offline';
                    instance.save(function(error) {
                        var parsed = JSON.parse(JSON.stringify(instance));
                        delete parsed.crypted_password;
                        params.method = 'update';
                        self.publish(parsed, params);
                    });
                });
                
                self.publish(parsed, params);
                options.token && self.setSession(parsed, options);
                client && client.registered(parsed, options);
                next && next(parsed, options);
            });
        },
        
        //###onlineUsers
        // Return all thread connections that have a 
        // user _id associated to them
        onlineUsers : function(next) {
            next && next({});
        },
        
        //###activeSessions
        // Return all connected users, based on active sessions, 
        // only works if the connect-mongodb is set to the same 
        // database as the rest of the app
        activeSessions : function(next) {
            Session.find({}, function(error, docs) {
                if (error) {
                    console.log('Read Sessions Error: ', error);
                }
                var parsed = JSON.parse(JSON.stringify(docs));
                var users = _(parsed)
                    .chain()
                    .map(function(session) {
                        var obj = JSON.parse(session.session);
                        return obj.user || {};
                    })
                    .value();
                
                next && next(users);
                return;
            });
        },
        
        //###getSession
        // Register a new user
        getSession : function(model, options, next) {
            if (!model || !options.token)
                return (options.error && options.error(400, model, options));
            
            Store.get(options.token, function (error, data) {
                if (error) {
                    console.log('getSession Error: ', error);
                    options.error && options.error(500, model, options);
                }
                console.log('getSession', data);
                
                var params = _.extend({
                    method  : 'read',
                    channel : 'app:users'
                }, options);
                
                // Check for session
                if (!data) return;
                if (!data.user) {
                    data.user = model;
                    
                    // Assign a temporary UUID
                    data.user.id || (data.user.id = Hash.md5(UUID()));
                    self.setSession(data.user, options);
                }
                
                //TODO: Replace functionality here with Tokens
                if (data.password) {
                    //data.user.password = data.password;
                    options.password = data.password;
                }
                
                if (data.user._id) {
                    data.user.id = data.user._id;
                //    self.authenticate(data.user, options, next);
                //    return;
                }
                
                // Remove user on disconnect
                con.on('end', function() {
                    console.log('Session Disconnect: ', con.id);
                    params.method = 'destroy';
                    self.publish(data.user, params);
                });
                
                // Existing session found
                self.publish(data.user, params);
                next && next(data.user, options);
                return;
            });
        },
        
        //###setSession
        // Register a new user
        setSession : function(model, options, next) {
            if (!model || !options.token)
                return (options.error && options.error(400, model, options));
                
            console.log('setUser', JSON.stringify(model));
            console.log('setUser', JSON.stringify(options));
            console.log('setUser Token', options.token);
            
            model.password && console.log('PASSWORD:', model.password);
            
            Store.get(options.token, function (error, data) {
                if (error) {
                    console.log('Set Session Error: ', error);
                    console.log('Set Session Error: ', data);
                    options.error && options.error(500, model, options);
                    return;
                }
            
                // Assign default user a temporary id
                data.user = model;
                data.password = model.password;
                
                console.log('setUser Data: ', data);
                
                Store.set(options.token, data, function(error) {
                    if (error) {
                        return (options.error && options.error(500, model, options));
                        console.log('Set Session SET Error: ', error);
                    }
                    console.log('Set Session SET Success: ');
                    next && next(model, options);
                });
            });
        },
        
        //###logout
        // Log the current user out, removing their cookie if found
        // and notifying everyone of the disconnect for view updates
        logout : function(model, options, next) {
            console.log('Logout: ', JSON.stringify(model));
            console.log('Logout: ', JSON.stringify(options));
            
            // Destroy current session if token provided
            if (options.token) {
                Store.destroy(options.token);
            }
            next && next(model, options);
            return;
        },
    });
};

//###config
// Set the reference to Mongoose so that the mongodb 
// configurations and registered schemas may be used
Auth.config = function(mongoose, session, next) {
    database = mongoose;
    Store = session;
    next && next();
};

// The top-level namespace. All public classes and modules will
// be attached to this. Exported for both CommonJS and the browser.
if (typeof exports !== 'undefined') {
    module.exports = Auth;
} else {
    root.Auth = Auth;
}