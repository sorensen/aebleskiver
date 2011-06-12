// RPC Protocol
// ----------------

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    bcrypt       = require('bcrypt'); 
    _            = require('underscore')._;
    SessionStore = require('connect-mongodb');
    Mongoose     = require('mongoose');
    UUID         = require('node-uuid');
    Hash         = require('./hash');
    Schema       = Mongoose.Schema;
    Schemas      = require('./schemas');
} else {
    this.Protocol = Protocol = {};
}

// Session storage
var Session = new SessionStore({
    dbname   : 'db',
    username : '',
    password : ''
});

onlineUsers = {};

// Hashing salt
var salt = "aebleskiver";

// Define server-callable methods
Protocol = module.exports = function(client, con) {
    var self = this;
    
    _.extend(this, {
    
        // Authenticate user with password
        authenticate : function(data, options, next) {
            if (!data.username || !data.password)
                return (options.error && options.error(400, data, options));

            console.log('authenticate options: ', data);
            console.log('authenticate options: ', options);
            
            var User = Mongoose.model('user');
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
                    
                    // Update the model to connection lookup
                    onlineUsers[doc._id] = con.id;
                
                    // Remove user on disconnect
                    con.on('end', function() {
                        if (onlineUsers[doc._id]) {
                            delete onlineUsers[doc._id];
                        }
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
    
        // Register a new user
        register : function(data, options, next) {
            console.log('register: ', JSON.stringify(data));
            console.log('register: ', JSON.stringify(options));
            
            if (!data.username || !data.password)
                return (options.error && options.error(400, data, options));
            
            // Request a gravatar image for the current 
            // user based on email address
            var params = {
                email : data.email,
                size  : 100
            };
            self.gravatar(params, function(resp) {
                data.avatar = resp;
                
                // Direct user model interface
                var User = Mongoose.model('user');
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
            });
        },
        
        // Return all thread connections that have a 
        // user _id associated to them
        onlineUsers : function(next) {
            console.log('ONLINE USERS: ', onlineUsers);
            next && next(onlineUsers);
        },
        
        // Start a conversation with another online user,
        // activated on the server to force the user in question
        // to subscribe to this current connection
        startConversation : function(model, options, next) {
            if (!options.id) {
                options.error && options.error(500, next);
                return;
            }
            if (onlineUsers[options.id] && Clients[onlineUsers[options.id]]) {
            
                Clients[onlineUsers[options.id]].startedConversation(model, options);
                next && next(options);
            }
        },
        
        // Return all connected users, based on active sessions, 
        // only works if the connect-mongodb is set to the same 
        // database as the rest of the app
        activeSessions : function(next) {
            var Model = Mongoose.model('session');
            Model.find({}, function(error, docs) {
                if (error) {
                    console.log('Read Sessions Error: ', error);
                }
                var parsed = JSON.parse(JSON.stringify(docs));
                var users = _(parsed).chain()
                    .map(function(session) {
                        var obj = JSON.parse(session.session);
                        return obj.user || {};
                    })
                    .value();
                
                next && next(users);
                return;
            });
        },
        
        // Register a new user
        getSession : function(model, options, next) {
            if (!model || !options.token)
                return (options.error && options.error(400, model, options));
            
            Session.get(options.token, function (error, data) {
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
                
                onlineUsers[data.user.id] = con.id;
                
                // Update the model to connection lookup
                console.log('ONLINE USERS: ', data.user.id);
                console.log('ONLINE USERS: ', onlineUsers);
                
                // Remove user on disconnect
                con.on('end', function() {
                    if (onlineUsers[data.user.id]) {
                        delete onlineUsers[data.user.id];
                    }
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
        
        // Register a new user
        setSession : function(model, options, next) {
            if (!model || !options.token)
                return (options.error && options.error(400, model, options));
                
            console.log('setUser', JSON.stringify(model));
            console.log('setUser', JSON.stringify(options));
            console.log('setUser Token', options.token);
            
            model.password && console.log('PASSWORD:', model.password);
            
            Session.get(options.token, function (error, data) {
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
                
                Session.set(options.token, data, function(error) {
                    if (error) {
                        return (options.error && options.error(500, model, options));
                        console.log('Set Session SET Error: ', error);
                    }
                    console.log('Set Session SET Success: ');
                    next && next(model, options);
                });
            });
        },
        
        // Log the current user out, removing their cookie if found
        // and notifying everyone of the disconnect for view updates
        logout : function(model, options, next) {
            console.log('Logout: ', JSON.stringify(model));
            console.log('Logout: ', JSON.stringify(options));
            
            // Destroy current session if token provided
            if (options.token) {
                Session.destroy(options.token);
            }
        
            next && next(model, options);
            return;
        },
    });

};