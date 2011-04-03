(function() {
    // Backbone dnode sync
    // -------------------
    //var Synchronize;
    if (typeof exports !== 'undefined') {
		// Dependancies
        _         = require('underscore')._;
        Backbone  = require('backbone');
        DNode     = require('dnode');
        Synchronize = module.exports;
    } else {
        Synchronize = this.Synchronize = {};
    }
    
    var server = false;
    var synced = {};
    var seperator = ':';
    
    // Helper function to get a URL from a Model or Collection as a property
    // or as a function.
    var getUrl = function(object) {
        if (!(object && object.url)) return null;
        return _.isFunction(object.url) ? object.url() : object.url;
    };
    
    var connected = function(model, options) {
    
        var name = model.name || model.collection.name;
        
        // Ooh boy is that a new magazine!?
        var magazine = _.extend({
            store : {
                name : model.name || model.collection.name
            },
            url : getUrl(model)
        }, model.toJSON());
        
        options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model);
        // Two year membership? Sure!
        // ...this is all free, right?
        server.subscribe(magazine, options);
        
        // I'll take those now, thank you.
        options.fetch && model.fetch(options.fetch);
    };
        
    // Transport methods for model storage, sending data 
    // through the socket instance to be saved on the server 
    Synchronize = function(model, options) {
    
        // Remote protocol
        var Protocol = function() {
            // Created model            
            this.created = function(data, opt, cb) {
                if (!data) return;
                if (model.url + seperator + data.id !== data.url) return;
                !model.get(data.id) && model.add(data);
            };
            
            // Fetched model
            this.read = function(data, opt, cb) {
                console.log('proto read', data);
                // Compare URL's to update the right collection
                if (!data.id && !_.first(data)) return;
                if (model.url + seperator + (data.id || _.first(data).id) !== data.url) return;
                !model.get(data.id) && model.add(data);
            };
            
            // Updated model data
            this.updated = function(data, opt, cb) {
                console.log('proto updated', data);
                // Compare URL's to update the right collection
                if (!data) return;
                if (model.url + seperator + data.id !== data.url) return;
                model.get(data.id).set(data);
            };
            
            // Destroyed model
            this.destroyed = function(data, opt, cb) {
                console.log('proto destroyed', data);
                if (!data) return;
                if (model.url + seperator + data.id !== data.url) return;
                model.remove(data);
            };
            
            this.published = function(data, opt, cb) {
                console.log('proto published', model);
                console.log('proto published', data);
                console.log('proto published', opt);
                // Check CRUD
                switch (opt.method) {
                    case 'read'   :    this.read(data, opt, cb); break;
                    case 'create' :  this.created(data, opt, cb); break;
                    case 'update' :  this.updated(data, opt, cb); break;
                    case 'delete' : this.destroyed(data, opt, cb); break;
                };
            };
        };
        
        // Setup our dnode listeners for server callbacks
        // as well as model bindings on connection
        var port = 8000;
        var block = function(remote) {
            server = remote;
            connected(model, options);
        };
        DNode(Protocol).connect(port, block); return;
        // Connect to DNode server only once
        if (!server) DNode(Protocol).connect(port, block);
        else {
            DNode(Protocol);
            connected(model, options);
        }
    };
    if (typeof exports !== 'undefined') module.exports = Synchronize;

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    Backbone.Model.prototype.url = function() {
      var base = getUrl(this.collection) || this.urlRoot || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) == seperator ? '' : seperator) + encodeURIComponent(this.id);
    },
    
    
    // Override `Backbone.sync` to use delegate to the model or collection's
    // *localStorage* property, which should be an instance of `Store`.
    Backbone.sync = function(method, model, options) {
    
        // Set model url and store
        var params = _.extend({
            store : {
                name : model.name || model.collection.name
            },
            url : getUrl(model)
        }, model.toJSON());
        
        // Callback testing
        var callback = function(cb) {
            console.log('sync col callback?', cb);
        };
        
        options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model);
        options.method  = method;
        
        if (!server) return;
        switch (method) {
            case 'read'   :    server.read(params, options, callback); break;
            case 'create' :  server.create(params, options, callback); break;
            case 'update' :  server.update(params, options, callback); break;
            case 'delete' : server.destroy(params, options, callback); break;
        };
    };
})()