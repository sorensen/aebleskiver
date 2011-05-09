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

// Redis session store
var Session = new SessionStore;

// Hashing salt
var salt = "aebleskiver";

// Define server-callable methods
Protocol = module.exports = function(client, con) {
    var self = this;
    
    // Client connected
    con.on('ready', function() {
        console.log('Auth ready: ', con.id);
    });
    // Remove user on disconnect
    con.on('end', function() {
        console.log('Auth disconnect: ', con.id);
    });
    
    _.extend(this, {
    
        // Authenticate user with password
        authenticate : function(data, options, next) {
            if (!data.username || !data.password)
                return (options.error && options.error(400, model, options));

            console.log('authenticate options: ', options);
            
            var User = Mongoose.model('user');
            var query = {
                username : data.username
            };
            User.findOne(query, function(error, doc) {
                if (error) {
                    console.log('Auth Error: ', error);
                    return (options.error && options.error(500, model, options));
                }
                if (!doc) return (options.error && options.error(404, data, options));
                
                if (doc.authenticate(data.password)) {
                    doc.password = data.password;
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
                            var parsed = JSON.parse(JSON.stringify(doc));
                            params.method = 'update';
                            self.publish(parsed, params);
                        });
                    });
                    doc.save(function(error) {
                        if (error) {
                            console.log('User Online Error: ', error);
                        }
                        self.publish(parsed, params);
                        options.token && self.setSession(parsed, options);
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
        },
        
        // Register a new user
        getSession : function(model, options, next) {
            if (!model || !options.token)
                return (options.error && options.error(400, model, options));
                
            console.log('getSession: model: ', JSON.stringify(model));
            console.log('getSession: options: ', options);
            
            Session.get(options.token, function (error, data) {
                if (error) {
                    console.log('getSession Error: ', error);
                    //return (options.error && options.error(500, model, options));
                }
                console.log('getSession Data: ', data);
                
                var params = _.extend({
                    method  : 'create',
                    channel : 'app:users'
                }, options);
                
                // Check for session
                if (!data) return;
                if (!data.user) {
                
                    data.user = model;
                    data.user.id || (data.user.id = Hash.md5(UUID()));
                    self.setSession(data.user, options);
                    console.log('getSession User: ', data.user);
                } 
                if (data.user._id) {
                    self.authenticate(data.user, options, next);
                    return;
                }
                // Remove user on disconnect
                con.on('end', function() {
                    console.log('Session Disconnect: ', con.id);
                    params.method = 'destroy';
                    self.publish(data.user, params);
                });
                // Existing session found
                console.log('getSession Publish: ', data.user);
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
            
            Session.get(options.token, function (error, data) {
                if (error) {
                    console.log('Set Session Error: ', error);
                    return (options.error && options.error(500, model, options));
                }
            
                // Assign default user a temporary id
                data.user = model;
                Session.set(options.token, data, function(error) {
                    if (error) return (options.error && options.error(500, model, options));
                    next && next(model, options);
                });
            });
        },
        
        // Log the current user out, removing their cookie if found
        // and notifying everyone of the disconnect for view updates
        logout : function(model, options, next) {
        
            console.log('logout', JSON.stringify(model));
            console.log('logout', JSON.stringify(options));
            // Destroy current session if token provided
            if (options.token) {
                Session.destroy(options.token);
            }
        
            next && next(model, options);
            return;
        },
    
        authFromToken : function(model, options, next) {
            if (!options.token) return;
        
            var params = {
                type  : 'token',
                query : {
                    email  : cookie.email,
                    series : cookie.series,
                    token  : options.token 
                }
            };
            
            self.read(model, params, function(token) {
                if (!token) return;
            
                var userParams = {
                    type  : 'user',
                    query : { email : token.email }
                };
                
                self.read(model, userParams, function(user) {
                    if (!user) return;
                
                    token.token = token.randomToken();
                    token.save(function() {
                    
                        next();
                    });
                });
            });
        },
    
        loadUser : function(model, options, next) {
        
        },
    });

};