(function() {
    // RPC Protocol
    // ----------------
    
    // Exports for CommonJS
    if (typeof exports !== 'undefined') {
        // Server
        _    = require('underscore')._;
        Keys = require('keys');
        UUID = require('node-uuid');
    } else {
        // Client
        this.Protocol = Protocol = {};
    }
    
    // Storage containers
    Clients = {};
    Channels = {};
    Subscriptions = {};
    Store = new Keys.Redis();
    //Store.clear();
    
    // Define server-callable methods
    Protocol = module.exports = function(client, con) {
        var self = this;
        
        // Client connected
        con.on('ready', function() {
            Clients[con.id] = client;
        });
        
        // Client disconnected
        con.on('end', function() {
            if (Clients[con.id]) delete Clients[con.id];
        });
        
        // Return all current connections
        this.connections = function(next) {
            next(Object.keys(Clients));
        };
        
        
        // Channel subscription
        this.subscribe = function(model, options, next) {
            if (!options.channel) {
                options.error && options.error(model, options);
                return;
            };
            var id   = con.id,
                chan = options.channel;
                
            // Check for the existance of channel in question and create if not found
            // TODO: Cleanup, this is a bit hacky, but works
            if (!Channels[chan]) Channels[chan] = { name:chan, clients:{} };
            if (!Channels[chan].clients[id]) Channels[chan].clients[id] = client
            
            // Check for the existance of channel in question and create if not found
            if (!Subscriptions[id]) Subscriptions[id] = { client:client, channels:{} };
            if (!Subscriptions[id].channels[chan]) Subscriptions[id].channels[chan] = {};
            
            // Remove all instances of current client the channels, by traversing
            // through the clients 'channel' property, instead of going through every channel
            con.on('end', function() {
                if (Subscriptions[id] && Subscriptions[id].channels) _.each(Subscriptions[id].channels, function(chan) {
                    if (Channels[chan].clients[id]) delete Channels[chan].clients[id];
                });
                delete Subscriptions[id];
            });
            
            // Notify all other channel subscribers that a new 
            // connection has been made
            _.each(Channels[chan].clients, function(someone) {
                someone.subscribed(model, options);
            });
            
            next && next();
        };
        
        // Unsubscribe from model changes via channel
        this.unsubscribe = function(model, options, next) {
            if (!model || !options.channel || !Channels[options.channel]) {
                options.error && options.error(model, options);
                return;
            };
            
            delete Channels[options.channel].clients[con.id];
            delete Subscriptions[con.id].channels[options.channel]
            
            // Notify each other channel client that someone has 
            // unsubscribed from the current channel / model
            _.each(Channels[options.channel].clients, function(someone) {
                someone.unsubscribed(model, options);
            });
            
            next && next();
        };
        
        // Publish a message to application clients based on channels
        this.publish = function(model, options, next) {
            if (!model || !options.channel || !Channels[options.channel]) {
                options.error && options.error(model, options);
                return;
            };
            
            // Publish based by channel
            _.each(Channels[options.channel].clients, function(someone) {
                someone.published(model, options)
            });
            
            next && next();
        };
        
        // CRUD: Create
        this.create = function(model, options, next) {
            if (!model || !model.id || !options.channel) {
                options.error && options.error(model, options);
                return;
            };
            
            // Generate a new unique id
            model.id = UUID();
            Store.set(options.url + ':' + model.id, JSON.stringify(model), function() {
                self.publish(model, options);
                
                next && next(model, options);
            });
        };
        
        // CRUD: Read
        this.read = function(model, options, next) {
        
            // Check for required data before continuing
            // trigger an error callback if one was sent
            if (!model || model.id || !options.channel) {
                options.error && options.error(model, options);
                return;
            };
            
            // Attempt to retrieve the model from our database
            Store.get(options.url, function(err, val) {
            
                // The model in question does not exist in the database
                if (!val) options.error && options.error(model, options);
                
                // Redis doesn't return a buffer
                else if (Store instanceof Keys.Redis) client && client.read(JSON.parse(val), options);
                
                // Raw buffer
                else client && client.read(JSON.parse(val.toString('utf8')), options);
                next && next(model, options);
            });
        };
        
        // CRUD: Update
        this.update = function(model, options, next) {
        
            // Check for required data before continuing
            // trigger an error callback if one was sent
            if (!model || !model.id) {
                options.error && options.error(model, options);
                return;
            };
            
            // Update existing model record in the database
            Store.set(options.url, JSON.stringify(model), function() {
            
                // Publish to the channel
                self.publish(model, options);
                next && next(model, options);
            });
        };
        
        // CRUD: Destroy 
        this.destroy = function(model, options, next) {
            if (!model || !options.channel) {
                options.error && options.error(model, options);
                return;
            };
            
            Store.remove(options.url, function() {
                self.publish(model, options);
                next && next(model, options);
            });
        };
    };
})()