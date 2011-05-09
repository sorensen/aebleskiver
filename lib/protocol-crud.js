// Backbone CRUD support
// ---------------------

// Basic implementation of server-side CRUD for 
// integrating with Backbone to allow for socket.io
// transport mechanisms

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    _        = require('underscore')._;
    Mongoose = require('mongoose');
    Schema   = Mongoose.Schema;
    Schemas  = require('./schemas');
} else {
    this.Protocol = Protocol = {};
}

//TODO: Pull from express configuration
// Connect to the database
Mongoose.connect('mongodb://localhost/db');

// The following are methods that the server may call to
Protocol = module.exports = function(client, con) {
    var self = this;
    
    _.extend(this, {
    
        // CRUD: Create
        create : function(data, options, next) {
            console.log('Create: ', JSON.stringify(data));
            console.log('Create: ', JSON.stringify(options));
            
            // Check for required data before continuing
            // trigger an error callback if one was sent
            if (!data || data._id || !options.channel || !options.type) 
                return (options.error && options.error(400, data, options));
                
            // Check for temporary request, this will just mock the action
            // to all current clients, without saving the data
            if (options.temporary) {
                this.publish(data, options);
                next && next(data, options);
                return;
            }
            var Model = Mongoose.model(options.type);
            var instance = new Model(data);

            instance.save(function (error) {
                if (error) {
                    console.log('Create Error: ', error);
                    return (options.error && options.error(500, data, options));
                }
                var parsed = JSON.parse(JSON.stringify(instance));
                
                options.silent || self.publish(parsed, options);
                next && next(parsed, options);
                return;
            });
        },
        
        // CRUD: Read
        read : function(data, options, next) {
            console.log('Read: ', JSON.stringify(data));
            console.log('Read: ', JSON.stringify(options));
            
            if (!options.type || !options.query)
                return (options.error && options.error(400, data, options));
            
            var Model = Mongoose.model(options.type);
            
            if (options.query && options.query.id) {
                Model.findOne(options.query, function(error, doc) {
                    if (error) {
                        console.log('Read Error: ', error);
                        return (options.error && options.error(500, data, options));
                    }
                    if (!doc) return (options.error && options.error(404, data, options));
                    
                    var parsed = JSON.parse(JSON.stringify(doc));
                    
                    client.read(parsed, options);
                    if (options.raw) {
                        // Raw object passed for server interaction
                        next && next(doc, options);
                    } else {
                        next && next(parsed, options);
                    }
                });
            } else {
                Model.find(options.query, function(error, docs) {
                    if (error) {
                        console.log('Read All Error: ', error);
                        return (options.error && options.error(500, data, options));
                    }
                    if (!docs || !docs[0]) return (options.error && options.error(404, data, options));
                    var parsed = JSON.parse(JSON.stringify(docs));
                        
                    client.read(parsed, options);
                    next && next(parsed, options);
                    return;
                });
            }
        },
        
        // CRUD: Update
        update : function(data, options, next) {
            console.log('Update: ', JSON.stringify(data));
            console.log('Update: ', JSON.stringify(options));
            
            if (!data || !data._id || !options.channel || !options.type)
                return (options.error && options.error(400, data, options));
            
            if (options.temporary) {
                this.publish(data, options);
                next && next(data, options);
                return;
            }
            var Model = Mongoose.model(options.type);
            
            Model.findById(data._id, function(error, doc) {
                if (error) {
                    console.log('Update Error: ', error);
                    return (options.error && options.error(500, data, options));
                }
                if (!doc) return (options.error && options.error(404, data, options));
                
                delete data._id;
                _.extend(doc, data);
                
                doc.save(function(error) {
                    if (error) return (options.error && options.error(500, data, options));
                    
                    var parsed = JSON.parse(JSON.stringify(doc));
                
                    options.silent || self.publish(parsed, options);
                    next && next(parsed, options);
                });
            });
        },
        
        // CRUD: Destroy 
        destroy : function(data, options, next) {
            console.log('Destroy: ', JSON.stringify(data));
            console.log('Destroy: ', JSON.stringify(options));
            
            if (!data || !data._id || !options.channel || !options.url || !options.type) 
                return (options.error && options.error(400, data, options));
                
            if (options.temporary) {
                this.publish(data, options);
                next && next(data, options);
                return;
            }
            
            //TODO: Actually delete the item from storage
            // Currently no models are being destroyed
            this.publish(data, options);
            next && next(data, options);
        }
    });
};