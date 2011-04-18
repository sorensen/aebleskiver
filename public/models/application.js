(function(Models) {
    // Application model
    // -----------------
    
    // World Model
    Models.ApplicationModel = Backbone.Model.extend({
    
        urlRoot  : 'app',
        defaults : {
            'visits'  : 0,
            'users'   : [],
            'rooms'   : []
        },
        
        createRoom : function(attr) {
            if (!attr) return;
            var self = this;
            var params = {
                error    : function(msg, resp, options) {},
                finished : function(resp) {
                    var params = {
                        error : function(msg, resp, options) {},
                    };
                
                    var keys = self.get('rooms');
                    if (keys) {
                        keys.push(resp.id);
                        if (keys.length > 50) keys = _.rest(keys, (keys.length - 50));
                        self.save({rooms : _.uniq(keys)}, params);
                        delete keys;
                    }
                }
            };
            this.rooms.create(attr, params);
        },
        
        initialize : function(options) {
            // Current user collection
            this.users = new Models.UserCollection();
            this.users.url = this.url() + ':users';
            
            // Active room collection
            this.rooms = new Models.RoomCollection();
            this.rooms.url = this.url() + ':rooms';
            
            var self = this;
            var params = {
                error : function(msg, resp, opt){},
            };
            
            // Subscribing to a model can be continued by just 
            // passing a callback, though, it will still execute a
            // 'finished' function if you pass one in the options
            this.subscribe(params, function(resp) {
            
                var next = function() {
                    var params = {
                        
                    };
                    // Sync up with the server through DNode, Backbone will
                    // supply the channel url if one is not supplied
                    self.rooms.subscribe(params, function(resp) {
                    
                        // Set a model for each id found for lookups
                        _.each(self.attributes.rooms, function(key) {
                            self.rooms.add({id : key}, {silent : true});
                        });
                        
                        // Use backbone to fetch from the server
                        self.rooms.each(function(room) {
                        
                            var params = {
                                error    : function(msg, resp, opt){},
                                finished : function(data) {
                                    self.rooms.add(data);
                                },
                            };
                            room.fetch(params);
                        });
                    });
                };
            
                var params = {
                    finished : function(resp) {
                    
                        // Increase the internal visit counter and 'update' the 
                        // model, this can be done through other analytic tools, 
                        // but this serves as a good demonstration for updating
                        self.save({visits : resp.visits + 1});
                        next();
                    },
                    error : function() {
                    
                        // This should only be triggered the first time the 
                        // application is run, since a model must be created
                        // before it can be 'read' or 'updated'
                        self.save({visits : 1}, {force : true});
                        next();
                    },
                };
                self.fetch(params);
            });
        }
    });
    
})(Models)