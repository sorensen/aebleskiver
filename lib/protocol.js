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
        'todos'     : new Keys.Memory(),
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
        var self = this;
        
        // Channel subscription
        this.subscribe = function(model, options, cb) {
        
            console.log('---------------------------------------');
            console.log('---------------------------------------');
            console.log('SUBSCRIBE CLIENT:', con.id);
            console.log('---------------------------------------');
            console.log('SUBSCRIBE MODEL:', model);
            console.log('---------------------------------------');
            console.log('SUBSCRIBE OPTIONS:', options);
            console.log('---------------------------------------');
            console.log('SUBSCRIBE CHANNELS:', channels);
            console.log('---------------------------------------');
            console.log('---------------------------------------');
            
            if (!channels[options.channel]) channels[options.channel] = {
                name    : options.channel,
                clients : {}
            };
            
            if (!channels[options.channel].clients[con.id]) channels[options.channel].clients[con.id] = client
            if (!subs[con.id]) subs[con.id] = {client : client, channels : {}};
            if (!subs[con.id].channels[options.channel]) subs[con.id].channels[options.channel] = {};
            
            con.on('end', function() {
                if (subs[con.id] && subs[con.id].channels) _.each(subs[con.id].channels, function(chan) {
                    if (channels[options.channel].clients[con.id]) delete channels[options.channel].clients[con.id];
                });
                delete subs[con.id];
            });
        };
        
        this.publish = function(model, options, cb) {
        
            console.log('---------------------------------------');
            console.log('---------------------------------------');
            console.log('PUBLISH CLIENT:', con.id);
            console.log('---------------------------------------');
            console.log('PUBLISH MODEL:', model);
            console.log('---------------------------------------');
            console.log('PUBLISH OPTIONS:', options);
            console.log('---------------------------------------');
            console.log('PUBLISH CHANNELS:', channels);
            console.log('---------------------------------------');
            console.log('---------------------------------------');
        
            // Publish based by channel
            if (channels[options.channel]) _.each(channels[options.channel].clients, function(someone) {
                console.log('who we got', someone);
                someone.published(model, options, cb)
            });
            
            // Publish to everyone
            _.each(clients, function(someone) {
                someone.published(model, options, cb)
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
            options.method = options.method || 'create';
            
            if (!model.id) {
                model.id = _.uniqueId('_');
                model.url += ':' + model.id;
            };   
            stores[model.store.name].set(model.url, JSON.stringify(model), function() {
                // Update everyone
                //_.each(clients, function(someone) {
                    //someone.created(model, options, cb);
                //});
                
                // Pub/Sub testing
                self.publish(model, options, cb);
                
                cb && cb(model);
            });
        };
        
        // Send current client data
        this.read = function(model, options, cb) {
            options.method = options.method || 'read';
            
            //console.log('read', model);
            if (model.id) {
                stores[model.store.name].get(model.url, function(err, val) {
                    if (!val) return;
                    if (stores[model.store.name] instanceof Keys.Redis) {
                        // Redis doesn't return a buffer
                        //client && client.read(JSON.parse(val), options, cb);
                        //client && client.published(JSON.parse(val), options, cb);
                        
                        self.publish(JSON.parse(val), options, cb);
                    } else {
                        // Raw buffer
                        //client && client.read(JSON.parse(val.toString('utf8')), options, cb);
                        //client && client.published(JSON.parse(val.toString('utf8')), options, cb);
                        
                        self.publish(JSON.parse(val.toString('utf8')), options, cb);
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
                                //client && client.read(JSON.parse(val), options, cb);
                                
                                self.publish(JSON.parse(val), options, cb);
            
                                cb && cb(model);
                            });
                        });
                    }, function() {
                        // OPTIONAL: Called when all data has been read
                        //if (tmp) client.read(_.values(tmp), options, cb);
                        //if (tmp) client.published(_.values(tmp), options, cb);
                        delete tmp;
                    }, pattern);
                // Raw buffer
                } else {
                    stores[model.store.name].each(function(val, key) {
                        if (!key) return;
                        tmp[key] = val.toString('utf8');
                        // OPTIONAL: Called as each key is read
                        //client && client.read(JSON.parse(val.toString('utf8')), options, cb);
                        
                        self.publish(JSON.parse(val.toString('utf8')), options, cb);
            
                        cb && cb(model);
                    }, function() {
                        // OPTIONAL: Called when all data has been read
                        //if (tmp) client.read(_.values(tmp), options, cb);
                        //if (tmp) client.published(_.values(tmp), options, cb);
                        delete tmp;
                    });
                }
            };
        };
        
        // Broadcast to all clients
        // TODO: sort based on channels
        this.update = function(model, options, cb) {
            options.method = options.method || 'update';
            
            stores[model.store.name].set(model.url, JSON.stringify(model), function() {
                // Update everyone        
                //_.each(clients, function(someone) {
                //    someone.updated(model, options, cb);
                //});
                
                self.publish(model, options, cb);
                
                cb && cb(model);
            });
        };
        
        // Notify clients of model destruction
        this.destroy = function(model, options, cb) {
            options.method = options.method || 'delete';
            
            stores[model.store.name].remove(model.url, function() {
                // Update everyone
                //_.each(clients, function(someone) {
                    //someone.destroyed(model, options, cb);
                //});
                
                self.publish(model, options, cb);
                
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