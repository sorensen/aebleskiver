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
        synced[options.channel] = model;
        
        console.log('SYNCED:', synced);
        
        // Two year membership? Sure!
        // ...this is all free, right?
        server.subscribe(magazine, options);
        
        // I'll take those now, thank you.
        console.log('fetching', model);
        options.save && model.save();
        options.fetch && model.fetch(options.fetch);
        options.finished && options.finished(model);
    };
        
    // Transport methods for model storage, sending data 
    // through the socket instance to be saved on the server 
    Synchronize = function(model, options) {
        options = options || {};
        
        // Remote protocol
        var Protocol = function() {
            // Created model
            // NOTE: New models must be created through sets
            this.created = function(data, opt, cb) {
                if (!data || !synced[opt.channel]) return;
                if (!synced[opt.channel].get(data.id)) synced[opt.channel].add(data);
                
                opt.finished && opt.finished(data);
            };
            
            // Fetched model
            this.read = function(data, opt, cb) {
                // Compare URL's to update the right collection
                if (!data.id && !_.first(data) || !synced[opt.channel]) return;
                
                var chan = synced[opt.channel];
                if (chan instanceof Backbone.Model) chan.set(data);
                else if (!chan.get(data.id)) chan.add(data);
                
                opt.finished && opt.finished(data);
            };
            
            // Updated model data
            this.updated = function(data, opt, cb) {
                if (!data || !synced[opt.channel]) return;
                
                if (synced[opt.channel].get(data.id)) synced[opt.channel].get(data.id).set(data);
                else synced[opt.channel].set(data);
                
                //opt.finished && opt.finished(data);
            };
            
            // Destroyed model
            this.destroyed = function(data, opt, cb) {
                if (!data) return;
                synced[opt.channel].remove(data) || delete synced[opt.channel];
                
                opt.finished && opt.finished(data);
            };
            
            this.published = function(data, opt, cb) {
                // Check CRUD
                switch (opt.method) {
                    case 'read'   :      this.read(data, opt, cb); break;
                    case 'create' :   this.created(data, opt, cb); break;
                    case 'update' :   this.updated(data, opt, cb); break;
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
        
        // Connect to DNode server only once
        if (!server) DNode(Protocol).connect(port, block);
        else connected(model, options);
    };
    if (typeof exports !== 'undefined') module.exports = Synchronize;

    urlError = function() { return ''; };
    
    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    Backbone.Model.prototype.url = function() {
      var base = getUrl(this.collection) || this.urlRoot || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) == seperator ? '' : seperator) + encodeURIComponent(this.id);
    };
    
    // Callback testing
    var callback = function(data, opt) {
        console.log('sync col callback?', data);
    };
    
    // Override `Backbone.sync` to use delegate to the model or collection's
    // *localStorage* property, which should be an instance of `Store`.
    Backbone.sync = function(method, model, options) {
        // Set model url and store
        var params = _.extend({
            store : {
                name : model.name || model.collection.name
            },
            url :  getUrl(model) || model.url
        }, model.toJSON());
        
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