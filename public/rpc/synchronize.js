(function(Protocols, Server) {
    // Backbone dnode sync
    // -------------------
    var synced = {};
    
    // Helper function to get a URL from a Model or Collection as a property
    // or as a function.
    var getUrl = function(object) {
        if (!(object && object.url)) return null;
        return _.isFunction(object.url) ? object.url() : object.url;
    };
    
    // Remote protocol
    Protocols.Backbone = function(client, con) {
        
        // Created model (NOTE) New models must be created through collections
        this.created = function(resp, options) {
            if (!synced[options.channel]) return;
            if (!synced[options.channel].get(resp.id)) synced[options.channel].add(resp);
            
            options.finished && options.finished(resp);
        };
        
        // Fetched model
        this.read = function(resp, options) {
            // Compare URL's to update the right collection
            if (!synced[options.channel]) return;
            var model = synced[options.channel];
            if (model instanceof Backbone.Model) model.set(resp);
            else if (!model.get(resp.id)) model.add(resp);
            
            options.finished && options.finished(resp);
        };
        
        // Updated model data
        this.updated = function(resp, options) {
            if (!synced[options.channel]) return;
            if (synced[options.channel].get(resp.id)) synced[options.channel].get(resp.id).set(resp);
            else synced[options.channel].set(resp);
            
            options.finished && options.finished(resp);
        };
        
        // Destroyed model
        this.destroyed = function(resp, options) {
            if (!synced[options.channel]) return;
            synced[options.channel].remove(resp) || delete synced[options.channel];
            
            options.finished && options.finished(resp);
        };
    };
    
    // Remote protocol
    Protocols.Pubsub = function(client, con) {
    
        // New subscription
        this.subscribed = function(resp, options) {
            if (!synced[options.channel]) return;
            
            options.finished && options.finished(resp);
        };
    
        // New subscription
        this.unsubscribed = function(resp, options) {
            if (!synced[options.channel]) return;
            
            options.finished && options.finished(resp);
        };
        
        // Published from the server
        this.published = function(resp, options) {
            switch (options.method) {
                case 'create' : this.created(resp, options); break;
                case 'update' : this.updated(resp, options); break;
                case 'delete' : this.destroyed(resp, options); break;
            };
        };
    };
    
    _.extend(Backbone.Model.prototype, {
    
        url : function() {
            var base = getUrl(this.collection) || this.urlRoot || '';
            if (this.isNew()) return base;
            return base + (base.charAt(base.length - 1) == ':' ? '' : ':') + encodeURIComponent(this.id);
        },
        
    });
    
    Backbone.Model.prototype.subscribe = Backbone.Collection.prototype.subscribe = function(options, callback) {
        options  || (options = {});
        options.channel || (options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model));
        if (!Server) {
            options.error && options.error(this, options);
            return;
        };
        if (!options.silent) this.trigger('subscribe', this, options);
        Server.subscribe.call(this.toJSON(), options callback);
        return this;
    };
        
    Backbone.Model.prototype.unsubscribe = Backbone.Collection.prototype.unsubscribe = function(options, callback) {
        options  || (options = {});
        options.channel || (options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model));
        
        if (!Server) {
            options.error && options.error(this, options);
            return;
        };
        if (!options.silent) this.trigger('unsubscribe', this, options);
        Server.unsubscribe.call(this.toJSON(), options, callback);
        delete synced[options.channel];
        return this;
    };
    
    _.extend(Backbone {
    
        sync : function(method, model, options) {
        
            if (!Server) {
                options.error && options.error(model, options);
                return;
            };
            
            options.url     || (getUrl(model) || model.url);
            options.channel || (options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model));
            options.method  || (options.method = method);
            
            var callback = options.remote || false;
            delete options.remote;
            
            switch (method) {
                case 'read'   : Server.read(model.toJSON(), options, callback); break;
                case 'create' : Server.create(model.toJSON(), options, callback); break;
                case 'update' : Server.update(model.toJSON(), options, callback); break;
                case 'delete' : Server.destroy(model.toJSON(), options, callback); break;
            };
        },
    });
    
})(Protocols, Server)