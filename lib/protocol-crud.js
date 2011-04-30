// Backbone CRUD support
// ---------------------

// Basic implementation of server-side CRUD for 
// integrating with Backbone to allow for socket.io
// transport mechanisms

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    _        = require('underscore')._;
    Keys     = require('keys');
    UUID     = require('node-uuid');
    Hash     = require('./hash');
    Buffer   = require('buffer').Buffer;
    Mongoose = require('mongoose');
    Schema   = Mongoose.Schema;
    //ObjectId = Schema.ObjectId;
    Schemas  = require('./schemas');
} else {
    this.Protocol = Protocol = {};
}

//TODO: Pull from express configuration
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
            options.silent || self.publish(doc, options);
            next && next(doc, options);
            return;
        });

        instance.save(function (err) {
            if (err) return;
            options.silent || self.publish(JSON.parse(JSON.stringify(instance)), options);
            next && next(JSON.parse(JSON.stringify(instance)), options);
            return;
        });
        
        options.error && options.error(500, data, options);
    };
    
    // CRUD: Read
    this.read = function(data, options, next) {
        console.log('Crud read: data: ', JSON.stringify(data));
        console.log('Crud read: opt: ', JSON.stringify(options));
        
        if (!options.channel || !options.type)
            return (options.error && options.error(400, data, options));
        
        var Model = Mongoose.model(options.type);
        
        if (options.query && options.query.id) {
            Model.findOne(options.query, function(error, doc) {
                if (!doc) return (options.error && options.error(404, data, options));
            
                //console.log('findOne error: ', error);
                console.log('findOne doc: ', JSON.stringify(doc));
                
                var parsed = JSON.parse(JSON.stringify(doc));
                
                client.read(parsed, options);
                next && next(parsed, options);
                return;
            });
        } else {
            Model.find(options.query, function(error, docs) {
                if (!docs || !docs[0]) return (options.error && options.error(404, data, options));
            
                //console.log('find error: ', error);
                //console.log('find doc: ', docs);
                console.log('find doc: ', JSON.stringify(docs));
                
                var parsed = JSON.parse(JSON.stringify(docs));
                    
                client.read(parsed, options);
                next && next(parsed, options);
                return;
            });
        }
        //options.error && options.error(404, data, options)
    };
    
    // CRUD: Update
    this.update = function(data, options, next) {
        console.log('Crud update: data: ', JSON.stringify(data));
        console.log('Crud update: opt: ', JSON.stringify(options));
        
        if (!data || !options.url || !options.type || !options.query)
            return (options.error && options.error(400, data, options));
        
        if (options.temporary) {
            this.publish(data, options);
            next && next(data, options);
            return;
        }
        var Model = Mongoose.model(options.type);
        
        Model.findOne(options.query, function(error, doc) {
            console.log('findById err: ', error);
            console.log('findById doc: ', JSON.stringify(doc));
            
            if (!doc) return (options.error && options.error(404, data, options));
            
            doc.update(data, function(error, doc) {
                console.log('update err: ', error);
                console.log('update doc: ', JSON.stringify(doc));
                
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