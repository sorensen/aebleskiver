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
    
    // Mongoose ORM
    Mongoose = require('mongoose');
    Schema   = Mongoose.Schema;
    ObjectId = Schema.ObjectId;
    require('./schema');
} else {
    this.Protocol = Protocol = {};
}
Mongoose.connect('mongodb://localhost/db');


// UUID hashing salt (for shortening)
var salt = 'abcdefghijklmnopqrstuvwxyz';

// Define server callable methods
Protocol = module.exports = function(client, con) {
    var self = this;
    
    // CRUD: Create
    this.create = function(data, options, next) {
        console.log('Crud create: data: ', JSON.stringify(data));
        console.log('Crud create: opt: ', JSON.stringify(options));
    
        // Check for required data before continuing
        // trigger an error callback if one was sent
        if (!data || data.id || !options.channel || !options.url || !options.type) 
            return (options.error && options.error(400, data, options));
            
        // Check for temporary request, this will just mock the action
        // to all current clients, without saving the data
        if (options.temporary) {
            self.publish(data, options);
            next && next(data, options);
            return;
        }
        
        var Model = Mongoose.model(options.type);
        console.log('model: ', Model);
        
        var Instance = new Model(data, function(error, doc) {
            console.log('Instance save error: ', error);
            console.log('Instance save doc: ', doc);
        });
        
        console.log('instance: ', Instance);
        
        if (Instance.doc) {
            console.log('Instance SAVE doc: ', Instance.doc);
            
            var parsed = JSON.parse(JSON.stringify(Instance.doc));
            
            options.silent || self.publish(parsed, options);
            next && next(parsed, options);
            return;
        }
        options.error && options.error(500, data, options);
    };
    
    // CRUD: Read
    this.read = function(data, options, next) {
        console.log('Crud read: data: ', JSON.stringify(data));
        console.log('Crud read: opt: ', JSON.stringify(options));
        
        if (!data || !options.channel || !options.url || !options.type)
            return (options.error && options.error(400, data, options));
        
        var Model = Mongoose.model(options.type);
        //var instance = new model(data);
        
        var query = options.query || data;
        
        console.log('model: ', Model);
        //console.log('instance: ', instance);
        if (query.id) {
            Model.findOne(query, function(error, doc) {
                if (!doc) return (options.error && options.error(404, data, options));
            
                console.log('findOne error: ', error);
                console.log('findOne doc: ', doc);
                
                var parsed = JSON.parse(JSON.stringify(doc));
                
                client.read(parsed, options);
                next && next(parsed, options);
                return;
            });
            return;
        }
        
        Model.find(query, function(error, docs) {
            if (!docs) return (options.error && options.error(404, data, options));
        
            console.log('find error: ', error);
            console.log('find doc: ', docs);
            console.log('find doc: ', JSON.stringify(docs));
            
            var parsed = JSON.parse(JSON.stringify(docs));
                
            client.read(parsed, options);
            next && next(parsed, options);
            return;
        });
        
        options.error && options.error(404, data, options)
    };
    
    // CRUD: Update
    this.update = function(data, options, next) {
        console.log('Crud update: data: ', JSON.stringify(data));
        console.log('Crud update: opt: ', JSON.stringify(options));
        
        if (!data || !options.url || !options.type || !options.query)
            return (options.error && options.error(400, data, options));
        
        if (options.temporary) {
            self.publish(data, options);
            next && next(data, options);
            return;
        }
        var query = options.query || data;
        
        var Model = Mongoose.model(options.type);
        //var Instance = new Model(data);
        
        Model.findOne(query, function(error, doc) {
            console.log('findById err: ', error);
            console.log('findById doc: ', doc);
            
            if (!doc) return (options.error && options.error(404, data, options));
            
            doc.update(data, function(error, doc) {
                console.log('update err: ', error);
                console.log('update doc: ', doc);
                
                var parsed = JSON.parse(JSON.stringify(doc));
            
                options.silent || client && client.read(parsed, options);
                next && next(parsed, options);
            });
        });
    };
    
    // CRUD: Destroy 
    this.destroy = function(data, options, next) {
        if (!data || !data.id || !options.channel || !options.url || !options.type) 
            return (options.error && options.error(400, data, options));
            
        if (options.temporary) {
            self.publish(data, options);
            next && next(data, options);
            return;
        }
        var query = options.query || data;
    };
};