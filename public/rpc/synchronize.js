(function(Protocol, Server) {
    // Backbone dnode sync
    // -------------------
    
    Synchronize = this.Synchronize = {};
    
    var synced = {};
    var seperator = ':';
    
    // Helper function to get a URL from a Model or Collection as a property
    // or as a function.
    var getUrl = function(object) {
        if (!(object && object.url)) return null;
        return _.isFunction(object.url) ? object.url() : object.url;
    };
    
    // Remote protocol
    Protocol.Backbone = function(client, con) {
    
        console.log('Protocol client: ', client);
        console.log('Protocol con: ', con);
    
        // New subscription
        this.subscribed = function(data, opt, cb) {
            if (!data || !synced[opt.channel]) return;
            opt.finished && opt.finished(data);
        };
    
        // New subscription
        this.unsubscribed = function(data, opt, cb) {
            if (!data || !synced[opt.channel]) return;
            opt.finished && opt.finished(data);
        };
        
        // Created model (NOTE) New models must be created through sets
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
            
            opt.finished && opt.finished(data);
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
        
        // Fetched gravatar
        this.gravatared = function(data, opt, cb) {
            console.log('Sync Gravatared: ', data);
            // Compare URL's to update the right collection
            if (!data) return;
            
            opt.finished && opt.finished(data);
        };
    };
    
    
    // Called only when DNode is connected
    Connected = function(model, options) {
        var name = model.name || model.collection.name;
        var url = (model.collection) ? getUrl(model.collection) : getUrl(model);
        
        // Ooh boy is that a new magazine!?
        var magazine = {
            store : {
                name : name
            },
            url : url
        };
        if (model instanceof Backbone.Model) {
            params = _.extend(magazine, model.toJSON());
        }
        
        options.channel = url;
        synced[options.channel] = model;
        
        if (options.unsubscribe) {
            var opt = _.extend({
                channel : options.channel,
            }, options.unsubscribe);
            
            // Alright, thats enough of those
            Server.unsubscribe(magazine, opt);
            delete synced[options.channel];
        } 
        else {
            var opt = _.extend({
                channel : options.channel,
            }, options.subscribe);
            
            // Two year membership? Sure!
            // ...this is all free, right?
            Server.subscribe(magazine, opt);
            
            // I'll take those now, thank you.
            options.save && model.save();
            options.fetch && model.fetch(options.fetch);
        }
        // All done with the setup
        options.finished && options.finished(model);
    };
        
    // Transport methods for model storage, sending data 
    // through the socket instance to be saved on the Server 
    Synchronize = function(model, options) {
        options = options || {};
        
        // Setup our dnode listeners for Server callbacks
        // as well as model bindings on connection
        if (!Server) DNode(Protocol.Backbone).connect(function(remote) {
        
            // Connect to DNode Server only once
            Server = remote;
            Connected(model, options);
        });
        // We are already connected
        else Connected(model, options);
    };
    if (typeof exports !== 'undefined') module.exports = Synchronize;

    urlError = function() { return ''; };
    
    // Default URL for the model's representation on the Server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    Backbone.Model.prototype.url = function() {
      var base = getUrl(this.collection) || this.urlRoot || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) == seperator ? '' : seperator) + encodeURIComponent(this.id);
    };
    
    // Callback testing
    var callback = function(data, opt) {
        //console.log('callback test:', data);
    };
    
    // Override `Backbone.sync` to use delegate to the model or collection's
    // *localStorage* property, which should be an instance of `Store`.
    Backbone.sync = function(method, model, options) {
        // Set model url and store
        var params = {
            store : {
                name : model.name || model.collection.name
            },
            url :  getUrl(model) || model.url
        };
        
        if (model instanceof Backbone.Model) {
            params = _.extend(params, model.toJSON());
        }
        
        callback = options.remote || callback;
        if (!options.channel) options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model);
        options.method  = method;
        
        if (!Server) return;
        switch (method) {
            case 'read'   :    Server.read(params, options, callback); break;
            case 'create' :  Server.create(params, options, callback); break;
            case 'update' :  Server.update(params, options, callback); break;
            case 'delete' : Server.destroy(params, options, callback); break;
        };
    };
})(Protocol, Server)