(function(Protocols) {
    // Backbone dnode sync
    // -------------------
    
    // Local storage for client channels / models
    var synced = {};
    
    // Remote protocol
    Protocols.Pubsub = function(client, con) {
    
        // New subscription
        this.subscribed = function(resp, options) {
            if (options.channel) return;
            options.finished && options.finished(resp);
        };
    
        // New subscription
        this.unsubscribed = function(resp, options) {
            if (options.channel) return;
            options.finished && options.finished(resp);
        };
        
        // Published from the server
        this.published = function(resp, options) {
            if (!options.channel) return;
            switch (options.method) {
                case 'create' : this.created(resp, options); break;
                case 'update' : this.updated(resp, options); break;
                case 'delete' : this.destroyed(resp, options); break;
            };
        };
    };
    
    // Backbone CRUD routines to be called from the server 
    // or delegated through the pub/sub protocol
    Protocols.Backbone = function(client, con) {
        
        // Created model (NOTE) New models must be created through collections
        this.created = function(resp, options) {
            if (!synced[options.channel].get(resp.id)) synced[options.channel].add(resp);
            options.finished && options.finished(resp);
        };
        
        // Fetched model
        this.read = function(resp, options) {
            if (synced[options.channel] instanceof Backbone.Model) 
                synced[options.channel].set(resp);
            
            else if (synced[options.channel] instanceof Backbone.Collection && !synced[options.channel].get(resp.id))
                synced[options.channel].add(resp);
            
            options.finished && options.finished(resp);
        };
        
        // Updated model data
        this.updated = function(resp, options) {
            if (synced[options.channel].get(resp.id)) synced[options.channel].get(resp.id).set(resp);
            else synced[options.channel].set(resp);
            options.finished && options.finished(resp);
        };
        
        // Destroyed model
        this.destroyed = function(resp, options) {
            synced[options.channel].remove(resp) || delete synced[options.channel];
            options.finished && options.finished(resp);
        };
    };
    
    // Helper function to get a URL from a Model or Collection as a property
    // or as a function.
    var getUrl = function(object) {
        if (!(object && object.url)) return null;
        return _.isFunction(object.url) ? object.url() : object.url;
    };
    
    var extention = {
        subscribe : function(options, callback) {
            if (!Server) return (options.error && options.error('Server not found.', model, options));
            var model = this;
            options         || (options = {});
            options.channel || (options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model));
            // Add the model to a local object container so that other methods
            // called from the server have access to it
            if (!synced[options.channel]) synced[options.channel] = model;
            if (!options.silent) this.trigger('subscribe', this, options);
            Server.subscribe(model.toJSON(), options, callback);
            return this;
        },
        
        unsubscribe : function(options, callback) {
            if (!Server) return (options.error && options.error('Server not found.', model, options));
            var model = this;
            options         || (options = {});
            options.channel || (options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model));
            if (!options.silent) this.trigger('unsubscribe', this, options);
            Server.unsubscribe(model.toJSON(), options, callback);
            delete synced[options.channel];
            return this;
        }
    };
    _.extend(Backbone.Model.prototype, {
        url : function() {
            var base = getUrl(this.collection) || this.urlRoot || '';
            if (this.isNew()) return base;
            return base + (base.charAt(base.length - 1) == ':' ? '' : ':') + encodeURIComponent(this.id);
        },
    });
    _.extend(Backbone.Model.prototype, extention);
    _.extend(Backbone.Collection.prototype, extention);
    _.extend(Backbone, {
        sync : function(method, model, options) {
            if (!Server) return (options.error && options.error('Server not found.', model, options));
            options.url     || (options.url = getUrl(model));
            options.channel || (options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model));
            options.method  || (options.method = method);
            
            // Direct server callback
            var callback = options.remote || false;
            delete options.remote;
            switch (method) {
                case 'read'   : Server.read(model.toJSON(), options, callback); break;
                case 'create' : Server.create(model.toJSON(), options, callback); break;
                case 'update' : Server.update(model.toJSON(), options, callback); break;
                case 'delete' : Server.destroy(model.toJSON(), options, callback); break;
            };
        }
    });
})(Protocols)