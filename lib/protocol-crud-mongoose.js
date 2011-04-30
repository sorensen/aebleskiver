// Backbone CRUD support
// ---------------------

// Basic implementation of server-side CRUD for 
// integrating with Backbone to allow for socket.io
// transport mechanisms

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    _        = require('underscore')._;
    Hash     = require('./hash');
    Mongoose = require('mongoose');
    Schema   = Mongoose.Schema;
    Schemas  = require('./schemas');
} else {
    this.Protocol = Protocol = {};
}

// Connect to the database
Mongoose.connect('mongodb://localhost/db');

// UUID hashing salt (for shortening)
var salt = 'abcdefghijklmnopqrstuvwxyz';

// The following are methods that the server may call to
Protocol = module.exports = function(client, con) {
    var self = this;
    
    // CRUD: Create
    this.create = function(data, options, next) {

        // Check for required data before continuing
        // trigger an error callback if one was sent
        if (!data || data._id || !options.channel || !options.url || !options.type) 
            return (options.error && options.error(400, data, options));
            
        // Check for temporary request, this will just mock the action
        // to all current clients, without saving the data
        if (options.temporary) {
            this.publish(data, options);
            next && next(data, options);
            return;
        }
        var Model = Mongoose.model(options.type);
        var instance = new Model(data, function(error, doc) {
            if (error) return (options.error && options.error(500, data, options));
            
            options.silent || self.publish(doc, options);
            next && next(doc, options);
            return;
        });

        instance.save(function (error) {
            if (error) return (options.error && options.error(500, data, options));
            
            options.silent || self.publish(JSON.parse(JSON.stringify(instance)), options);
            next && next(JSON.parse(JSON.stringify(instance)), options);
            return;
        });
        
    };
    
    // CRUD: Read
    this.read = function(data, options, next) {
        if (!data || !options.channel || !options.url || !options.type)
            return (options.error && options.error(400, data, options));
        
        var Model = Mongoose.model(options.type);
        
        if (options.query && options.query.id) {
            Model.findOne(options.query, function(error, doc) {
                if (!doc) return (options.error && options.error(404, data, options));
                
                var parsed = JSON.parse(JSON.stringify(doc));
                
                client.read(parsed, options);
                next && next(parsed, options);
            });
        } else {
            Model.find(options.query, function(error, docs) {
                if (!docs || !docs[0]) return (options.error && options.error(404, data, options));
                
                var parsed = JSON.parse(JSON.stringify(docs));
                    
                client.read(parsed, options);
                next && next(parsed, options);
            });
        }
    };
    
    // CRUD: Update
    this.update = function(data, options, next) {
        if (!data || !options.url || !options.type || !options.query)
            return (options.error && options.error(400, data, options));
        
        if (options.temporary) {
            this.publish(data, options);
            next && next(data, options);
            return;
        }
        var Model = Mongoose.model(options.type);
        
        Model.findOne(options.query, function(error, doc) {
            if (!doc) return (options.error && options.error(404, data, options));
            
            doc.update(data, function(error, doc) {
                if (error) return (options.error && options.error(500, data, options));
                
                var parsed = JSON.parse(JSON.stringify(doc));
            
                options.silent || client && client.read(parsed, options);
                next && next(parsed, options);
            });
        });
    };
    
    // CRUD: Destroy 
    this.destroy = function(data, options, next) {
        if (!data || !data._id || !options.channel || !options.url || !options.type) 
            return (options.error && options.error(400, data, options));
            
        if (options.temporary) {
            this.publish(data, options);
            next && next(data, options);
            return;
        }
        
        //TODO: Actually delete the item from storage
        // Currently no models are being destroyed
    };
};