console.log('Pubsub: ', Protocols);

(function(Protocols) {
    // Backbone dnode sync
    // -------------------
    
    // Local storage for client channels / models
    var synced = {};
    
    // Remote protocol
    Protocols.Pubsub = function(client, con) {
    
        // New subscription
        this.subscribed = function(resp, options) {
            console.log('subscribed: ', resp);
            console.log('subscribed: ', options);
            if (!synced[options.channel]) return;
            
            options.finished && options.finished(resp);
        };
    
        // New subscription
        this.unsubscribed = function(resp, options) {
            console.log('unsubscribed: ', resp);
            console.log('unsubscribed: ', options);
            if (!synced[options.channel]) return;
            
            options.finished && options.finished(resp);
        };
        
        // Published from the server
        this.published = function(resp, options) {
            console.log('published: ', resp);
            console.log('published: ', options);
            
            if (!options.channel || !synced[options.channel]) return;
            
            switch (options.method) {
                case 'create' : this.created(synced[options.channel], resp, options); break;
                case 'update' : this.updated(synced[options.channel], resp, options); break;
                case 'delete' : this.destroyed(synced[options.channel], resp, options); break;
            };
        };
    };
    
    // Helper function to get a URL from a Model or Collection as a property
    // or as a function.
    var getUrl = function(object) {
        if (!(object && object.url)) return null;
        return _.isFunction(object.url) ? object.url() : object.url;
    };
    
    Backbone.Model.prototype.subscribe = Backbone.Collection.prototype.subscribe = function(options, callback) {
        console.log('Subscribe: ', options);
        console.log('Subscribe: ', this);
        
        var model = this;
        options  || (options = {});
        options.channel || (options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model));
        if (!Server) {
            options.error && options.error(model, options);
            return;
        };
        
        // Add the model to a local object container so that other methods
        // called from the server have access to it
        if (!synced[options.channel]) synced[options.channel] = model;
        if (!options.silent) this.trigger('subscribe', this, options);
        Server.subscribe(model.toJSON(), options, callback);
        return this;
    };
    
    Backbone.Model.prototype.unsubscribe = Backbone.Collection.prototype.unsubscribe = function(options, callback) {
        console.log('Unsubscribe: ', this);
        
        var model = this;
        options  || (options = {});
        options.channel || (options.channel = (model.collection) ? getUrl(model.collection) : getUrl(model));
        
        if (!Server) {
            options.error && options.error(model, options);
            return;
        };
        if (!options.silent) this.trigger('unsubscribe', this, options);
        Server.unsubscribe(model.toJSON(), options, callback);
        delete synced[options.channel];
        return this;
    };
    
})(Protocols)