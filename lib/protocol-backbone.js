(function() {
    // RPC Protocol
    // ----------------
    
    // Exports for CommonJS
    if (typeof exports !== 'undefined') {
        _    = require('underscore')._;
        Keys = require('keys');
        UUID = require('node-uuid');
    } else {
        this.Protocol = Protocol = {};
    }
    
    // Storage containers
    Store = new Keys.Memory();
    
    // Check for buffered data
    var buffered = (Store instanceof Keys.Redis) ? false : true;
    
    // Define server-callable methods
    Protocol = module.exports = function(client, con) {
        var self = this;
        
        // CRUD: Create
        this.create = function(model, options, next) {
            console.log('Create: model: ', JSON.stringify(model));
            console.log('Create: options: ', JSON.stringify(options));
            
            if (!model || model.id || !options.channel || !options.url) 
                return (options.error && options.error('Invalid parameters.', model, options));
                
            // Generate a new unique id
            model.id = UUID();
            var key = options.url + ':' + model.id;
            
            Store.has(key, function(err, exists) {
                if (exists) return (options.error && options.error('Model not found.', model, options));
                
                // Set the created timestamp if one is supplied
                model.created && (model.created = new Date().getTime());
        
                Store.set(key, JSON.stringify(model), function() {
                    self.publish(model, options);
                    next && next(model, options);
                });
            });
        };
        
        // CRUD: Read
        this.read = function(model, options, next) {
            console.log('Read: model: ', JSON.stringify(model));
            console.log('Read: options: ', JSON.stringify(options));
        
            // Check for required data before continuing
            // trigger an error callback if one was sent
            if (!model || !options.channel || !options.url)
                return (options.error && options.error('Invalid parameters.', model, options));
            
            // Attempt to retrieve the model from our database
            Store.has(options.url, function(err, exists) {
                // The model in question does not exist in the database
                if (!exists) return (options.error && options.error('Model not found.', model, options));
                
                Store.get(options.url, function(err, val) {
                    if (!val) options.error && options.error(model, options);
                    
                    val = buffered ? val.toString('utf8') : val;
                    client && client.read(JSON.parse(val), options);
                    next && next(JSON.parse(val), options);
                });
            });
        };
        
        // CRUD: Update
        this.update = function(model, options, next) {
            console.log('Update: model: ', JSON.stringify(model));
            console.log('Update: options: ', JSON.stringify(options));
        
            // Check for required data before continuing
            // trigger an error callback if one was sent
            if (!model || !model.id || !options.url) {
                options.error && options.error('Invalid parameters.', model, options);
                return;
            };
            Store.has(options.url, function(err, exists) {
                if (!exists && !options.force) return (options.error && options.error('Model not found.', model, options));
                    
                // Set the modified timestamp if one is present
                model.modified && (model.modified = new Date().getTime());
                
                // Update existing model record in the database
                Store.set(options.url, JSON.stringify(model), function() {
                    // Publish to the channel
                    self.publish(model, options);
                    next && next(model, options);
                });
            });
        };
        
        // CRUD: Destroy 
        this.destroy = function(model, options, next) {
            console.log('Destroy: model: ', JSON.stringify(model));
            console.log('Destroy: options: ', JSON.stringify(options));
            
            if (!model || !model.id || !options.channel || !options.url) 
                return (options.error && options.error('Invalid parameters.', model, options));
                
            Store.has(options.url, function(err, exists) {
                if (!exists) return (options.error && options.error('Model not found.', model, options));
            
                Store.remove(options.url, function() {
                    self.publish(model, options);
                    next && next(model, options);
                });
            });
        };
    };
})()