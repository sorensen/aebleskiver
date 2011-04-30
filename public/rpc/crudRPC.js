(function(Protocols) {
    // Backbone DNode CRUD
    // -------------------
    
    // Backbone CRUD routines to be called from the server 
    // or delegated through the pub/sub protocol
    Protocols.CRUD = function(client, con) {
        
        // Delegate to the 'synced' event unless further extention is 
        // needed per CRUD event
        this.created   = function(resp, options) { this.synced(resp, options); };
        this.read      = function(resp, options) { this.synced(resp, options); };
        this.updated   = function(resp, options) { this.synced(resp, options); };
        this.destroyed = function(resp, options) { this.synced(resp, options); };
        
        // Default synchronization event, call to Backbones internal
        // 'success' method, then the custom 'finished' method when 
        // everything has been completed
        this.synced = function(resp, options) {
            options.success && options.success(resp);
            options.finished && options.finished(resp);
        };
    };
    
    _.extend(Backbone, {
        sync : function(method, model, options) {
            if (!Server) return (options.error && options.error(503, model, options));
            
            // Set the RPC options for model interaction
            options.type      || (options.type = model.type || model.collection.type);
            options.url       || (options.url = Helpers.getUrl(model));
            options.channel   || (options.channel = (model.collection) ? Helpers.getUrl(model.collection) : Helpers.getUrl(model));
            options.method    || (options.method = method);
            
            switch (method) {
                case 'read'   : Server.read(model.toJSON(), options); break;
                case 'create' : Server.create(model.toJSON(), options); break;
                case 'update' : Server.update(model.toJSON(), options); break;
                case 'delete' : Server.destroy(model.toJSON(), options); break;
            };
        }
    });
    
})(Protocols)