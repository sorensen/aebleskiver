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
    // can return all keys based on a url or collection, reverts
    // to normal use if no pattern is supplied.
    Keys.Redis.prototype.each = function(fn, done, pattern){
        var self = this;
        // We don't need the entire database
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
    var Store = new Keys.Memory();
        
    // Define server-callable methods
    Protocol = module.exports = function(client, con) {
        var self = this;
        
        // Channel subscription
        this.subscribe = function(model, options, cb) {
            console.log('RPC Subscribe:', model);
            console.log('RPC Subscribe:', options);
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
            // Publish based by channel
            console.log('Publish: ', JSON.stringify(model));
            console.log('Publish: ', JSON.stringify(options));
            
            if (channels[options.channel]) _.each(channels[options.channel].clients, function(someone) {
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
            console.log('RPC Create:', model);
            options.method = options.method || 'create';
            
            // Generate a new unique id
            if (!model.id) {
                model.id = _.uniqueId('_');
                model.url += ':' + model.id;
            };   
            Store.set(model.url, JSON.stringify(model), function() {
                self.publish(model, options, cb);
                //cb && cb(model, options);
            });
        };
        
        // Send current client data
        this.read = function(model, options, cb) {
            options.method = options.method || 'read';
            
            console.log('RPC Read:', model);
            if (model.id) {
                Store.get(model.url, function(err, val) {
                    if (!val) {
                        options.error && options.error(model);
                        return;
                    }
                    if (Store instanceof Keys.Redis) {
                        // Redis doesn't return a buffer
                        client && client.read(JSON.parse(val), options, cb);
                    } else {
                        // Raw buffer
                        client && client.read(JSON.parse(val.toString('utf8')), options, cb);
                    }
                });
            };
        };
        
        // Broadcast to all clients
        // TODO: sort based on channels
        this.update = function(model, options, cb) {
            console.log('RPC Update:', model);
            options.method = options.method || 'update';
            
            Store.set(model.url, JSON.stringify(model), function() {
                self.publish(model, options, cb);
                cb && cb(model, options);
            });
        };
        
        // Notify clients of model destruction
        this.destroy = function(model, options, cb) {
            console.log('RPC Destroy:', model);
            options.method = options.method || 'delete';
            
            Store.remove(model.url, function() {
                self.publish(model, options, cb);
                cb && cb(model, options);
            });
        };
        
        // Return all current connections
        this.connections = function(cb) {
            cb(Object.keys(clients));
            client.connections(Object.keys(clients));
        };
    };
})()