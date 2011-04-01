(function() {
    // Backbone dnode sync
    // -------------------
    
    // Helper function to get a URL from a Model or Collection as a property
    // or as a function.
    var getUrl = function(object) {
        if (!(object && object.url)) return null;
        return _.isFunction(object.url) ? object.url() : object.url;
    };
    
    // Transport methods for model storage, sending data 
    // through the socket instance to be saved on the server 
    this.Synchronize = function(model, options) {
        var name = model.name || model.collection.name;
        if (!options) options = {};
        
        var url = model.url || getUrl(model);
        
        // Setup our dnode listeners for server callbacks
        // as well as model bindings on connection
        DNode(function() {
            // Created model            
            this.created = function(data, opt, cb) {
                if (!data) return;
                var compare = model.url + ':' + data.id;
                if (data.url !== compare) return;
                if (!model.get(data.id)) model.add(data);
            };
            
            // Fetched model
            this.read = function(data, opt, cb) {
                // Compare URL's to update the right collection
                if (!data) return;
                if (!data.id && !_.first(data)) return;
                if ((data.url || _.first(data).url) !== model.url + ':' + data.id) return;
                if (!model.get(data.id)) model.add(data);
            };
            
            // Updated model data
            this.updated = function(data, opt, cb) {
                // Compare URL's to update the right collection
                if (!data) return;
                if (data.url !== model.url + ':' + data.id) return;
                model.get(data.id).set(data);
            };
            
            // Destroyed model
            this.destroyed = function(data, opt, cb) {
                if (!data) return;
                if (data.url !== model.url + ':' + data.id) return;
                model.remove(data);
            };
            
        }).connect(function(remote) {
            if (!model.server) model.server = remote;
            // Check for initial bootstrapping
            if (options.fetch) model.fetch(options.fetch);
        });
        
        return this;
    };

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    Backbone.Model.prototype.url = function() {
      var base = getUrl(this.collection) || this.urlRoot || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) == ':' ? '' : ':') + encodeURIComponent(this.id);
    },
    
    // Override `Backbone.sync` to use delegate to the model or collection's
    // *localStorage* property, which should be an instance of `Store`.
    Backbone.Collection.prototype.sync = function(method, model, options) {
        // Remote storage settings
        var settings = {
            url   : getUrl(model),
            model : model.toJSON(),
            store : {
                name : model.name,
                type : 'memory'
            }
        };
        
        // Callback testing
        var callback = function(cb) {
            console.log('sync model callback?', cb);
        };
        if (!model.server) return;
        switch (method) {
            case 'create' : model.server.create(settings,  options, callback); break;
            case 'read'   : model.server.read(settings,    options, callback); break;
            case 'update' : model.server.update(settings,  options, callback); break;
            case 'delete' : model.server.destroy(settings, options, callback); break;
        };
    };
    
    // Override `Backbone.sync` to use delegate to the model or collection's
    // *localStorage* property, which should be an instance of `Store`.
    Backbone.Model.prototype.sync = function(method, model, options) {    
        if (!model.url) model.url = getUrl(model);
        
        // Set model url and store
        model.set({
            store : {
                name : model.collection.name
            },
            url   : getUrl(model)
        });
        
        // Callback testing
        var callback = function(cb) {
            console.log('sync col callback?', cb);
        };
        if (!model.collection.server) return;
        switch (method) {
            case 'create' : model.collection.server.create(model.toJSON(),  options, callback); break;
            case 'read'   : model.collection.server.read(model.toJSON(),    options, callback); break;
            case 'update' : model.collection.server.update(model.toJSON(),  options, callback); break;
            case 'delete' : model.collection.server.destroy(model.toJSON(), options, callback); break;
        };
    };    
})()