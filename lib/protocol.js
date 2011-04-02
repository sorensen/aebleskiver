(function() {
    // RPC Protocol
    // ----------------
    
    // Exports for CommonJS
    if (typeof exports !== 'undefined') {
        // Server
        _       = require('underscore')._;
        Keys    = require('./keys');
    } else {
        // Client
        this.Protocol = Protocol = {};
    }
    
    // Override the key pattern for redis keys so that we 
    // can return all keys based on a url
    Keys.Redis.prototype.each = function(fn, done, pattern){
        var self = this;
        this.client.keys(pattern || '*', function(err, keys){
            var keys = keys.toString().split(' '),
                pending = keys.length;
            for (var i = 0, len = keys.length; i < len; ++i) {
                (function(key){
                    self.get(key, function(err, val){
                        fn(val, key);
                        --pending || (done && done());
                    });
                })(keys[i]);
            }
        });
    };
    
    // Storage containers
    var subs     = {};
    var channels = {};
    var clients  = {};
    var stores   = {
        // Application data types
        'todos'     : new Keys.Redis(),
        'chats'     : new Keys.Memory(),
        'messages'  : new Keys.Memory(),
        'users'     : new Keys.Memory()    
    };
    
    // Bye bye data!
    stores['todos'].clear();
        
    // Define server-callable methods
    Protocol = module.exports = function(client, con) {
        
        console.log('---------------------------------------');
        console.log('New connection:', client);
        console.log('New connection:', con);
        console.log('---------------------------------------');
        
        // Channel subscription
        this.subscribe = function(emit) {
            subs[con.id] = emit;
            
            con.on('end', function() {
                delete subs[con.id];
            });
        };
        
        this.publish = function() {
            var args = arguments;
            _.each(subs, function(emit) {
                emit.apply(emit, args);
            });
        };
        
        // Client connected
        con.on('ready', function() {
            clients[con.id] = client;
        });
        
        // Client disconnected
        con.on('end', function() {
            delete clients[con.id];
        });
        
        // Create data and broadcast to all
        this.create = function(model, options, cb) {
            // Pub/Sub testing
            this.publish(model);
            
            if (!model.id) {
                model.id = _.uniqueId('_');
                model.url += ':' + model.id;
            };   
            stores[model.store.name].set(model.url, JSON.stringify(model), function() {
                // Update everyone
                _.each(clients, function(someone) {
                    someone.created(model, options, cb);
                });
                
                cb && cb(model);
            });
        };
        
        // Send current client data
        this.read = function(model, options, cb) {
            
            console.log('read', model);
            if (model.id) {
                stores[model.store.name].get(model.url, function(err, val) {
                    if (!val) return;
                    if (stores[model.store.name] instanceof Keys.Redis) {
                        // Redis doesn't return a buffer
                        client && client.read(JSON.parse(val), options, cb);
                    } else {
                        // Raw buffer
                        client && client.read(JSON.parse(val.toString('utf8')), options, cb);
                    }
                });
            } else {
                var tmp = {};
                // Redis storage
                if (stores[model.store.name] instanceof Keys.Redis) {
                    var pattern = model.url + '*';
                    
                    stores[model.store.name].each(function(val, key) {
                        if (!key) return;
                        _.each(key.split(','), function(hash) {
                            stores[model.store.name].get(hash, function(err, val) {
                                if (!val) return;
                                tmp[hash] = JSON.parse(val);
                                // OPTIONAL: Called as each key is read
                                client && client.read(JSON.parse(val), options, cb);
            
                                cb && cb(model);
                            });
                        });
                    }, function() {
                        // OPTIONAL: Called when all data has been read
                        //if (tmp) client.read(_.values(tmp), options, cb);
                        delete tmp;
                    }, pattern);
                // Raw buffer
                } else {
                    stores[model.store.name].each(function(val, key) {
                        if (!key) return;
                        tmp[key] = val.toString('utf8');
                        // OPTIONAL: Called as each key is read
                        client && client.read(JSON.parse(val.toString('utf8')), options, cb);
            
                        cb && cb(model);
                    }, function() {
                        // OPTIONAL: Called when all data has been read
                        //if (tmp) client.read(_.values(tmp), options, cb);
                        delete tmp;
                    });
                }
            };
        };
        
        // Broadcast to all clients
        // TODO: sort based on channels
        this.update = function(model, options, cb) {
            stores[model.store.name].set(model.url, JSON.stringify(model), function() {
                // Update everyone        
                _.each(clients, function(someone) {
                    someone.updated(model, options, cb);
                });
                
                cb && cb(model);
            });
        };
        
        // Notify clients of model destruction
        this.destroy = function(model, options, cb) {
            stores[model.store.name].remove(model.url, function() {
                // Update everyone
                _.each(clients, function(someone) {
                    someone.destroyed(model, options, cb);
                });
                
                cb && cb(model);
            });
        };
        
        // Return all current connections
        this.connections = function(cb) {
            cb(Object.keys(clients));
            client.connections(Object.keys(clients));
        };
    };
})()