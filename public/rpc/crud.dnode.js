//  Aebleskiver
//  (c) 2011 Beau Sorensen
//  Backbone may be freely distributed under the MIT license.
//  For all details and documentation:
//  https://github.com/sorensen/aebleskiver

(function(ß) {
    // Backbone DNode CRUD
    // -------------------
    
    // Backbone CRUD routines to be called from the ß.Server 
    // or delegated through the pub/sub protocol
    ß.Protocols.CRUD = function(client, con) {
        
        _.extend(this, {
            // Delegate to the 'synced' event unless further extention is 
            // needed per CRUD event
            created : function(resp, options) {
                resp = _.getMongoId(resp);
                var model = ß.Store[options.channel];
                // Model processing
                if (model instanceof Backbone.Model) {
                    model.set(model.parse(resp));
                // Collection processing
                } else if (model instanceof Backbone.Collection) {
                    if (!model.get(resp.id)) model.add(model.parse(resp));
                }
                options.finished && options.finished(resp);
            },
            
            read : function(resp, options) {
                resp = _.getMongoId(resp);
                var model = ß.Store[options.channel];
                // Model Processing
                if (model instanceof Backbone.Model) {
                    model.set(model.parse(resp));
                // Collection processing
                } else if (model instanceof Backbone.Collection) {
                    if (_.isArray(resp)) {
                        model.reset(model.parse(resp));
                    } else if (!model.get(resp.id)) {
                        model.add(model.parse(resp));
                    }
                }
                options.finished && options.finished(resp);
            },
            
            updated : function(resp, options) {
                resp = _.getMongoId(resp);
                var model = ß.Store[options.channel];
                // Collection processing
                if (model.get(resp.id)) {
                    model.get(resp.id).set(model.parse(resp));
                // Model processing
                } else {
                    model.set(model.parse(resp));
                }
                options.finished && options.finished(resp);
            },
            
            destroyed : function(resp, options) {
                resp = _.getMongoId(resp);
                ß.Store[options.channel].remove(resp) || delete ß.Store[options.channel];
                options.finished && options.finished(resp);
            },
        
            // The following procedures will only work for the acting client, 
            // this may prove to be useful for future procedures 
            selfCreated   : function(resp, options) { this.synced(resp, options) },
            selfRead      : function(resp, options) { this.synced(resp, options) },
            selfUpdated   : function(resp, options) { this.synced(resp, options) },
            selfDestroyed : function(resp, options) { this.synced(resp, options) },
            
            // Default synchronization event, call to Backbones internal
            // 'success' method, then the custom 'finished' method when 
            // everything has been completed
            synced : function(resp, options) {
                resp = _.getMongoId(resp);
            
                // Call to Backbone's predefined 'success' method which 
                // is created per each 'sync' event, then to an optional
                // 'finished' method for any final procedures
                options.success && options.success(resp);
                options.finished && options.finished(resp);
            }
        });
    };
    
    // Add to underscore utility functions to allow optional usage
    // This will allow other storage options easier to manage, such as
    // 'localStorage'. This must be set on the model and collection to 
    // be used on directly. Defaults to 'Backbone.sync' otherwise.
    _.mixin({
        // Set the model or collection's sync method to communicate through DNode
        sync : function(method, model, options) {
            if (!ß.Server) return (options.error && options.error(503, model, options));
            
            // Remove the Backbone id from the model as not to conflict with 
            // Mongoose schemas, it will be re-assigned when the model returns
            // to the client side
            if (model.attributes && model.attributes._id) delete model.attributes.id;
            
            // Set the RPC options for model interaction
            options.type      || (options.type = model.type || model.collection.type);
            options.url       || (options.url = _.getUrl(model));
            options.channel   || (options.channel = (model.collection) ? _.getUrl(model.collection) : _.getUrl(model));
            options.method    || (options.method = method);
            
            // Delegate method call based on action
            switch (method) {
                case 'read'   : ß.Server.read({}, options); break;
                case 'create' : ß.Server.create(model.toJSON(), options); break;
                case 'update' : ß.Server.update(model.toJSON(), options); break;
                case 'delete' : ß.Server.destroy(model.toJSON(), options); break;
            };
        }
    });
    
})(ß)