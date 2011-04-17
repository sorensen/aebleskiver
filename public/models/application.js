(function(Models) {
    // Application model
    // -----------------
    
    // World Model
    Models.ApplicationModel = Backbone.Model.extend({
    
        name     : 'application',
        urlRoot  : 'app',
        
        defaults : {
            'visits'  : 0,
            'users'   : [],
            'chats'   : []
        },
        
        createChat : function(attr) {
            if (!attr) return;
            
            var self = this;
            var params = {
                error    : function(msg, resp, options) {},
                finished : function(resp) {
                    var params = {
                        error : function(msg, resp, options) {},
                    };
                
                    var keys = self.get('chats');
                    if (keys) {
                        keys.push(resp.id);
                        if (keys.length > 50) keys = _.rest(keys, (keys.length - 50));
                        self.save({chats : _.uniq(keys)}, params);
                        delete keys;
                    }
                }
            };
            this.chats.create(attr, params);
        },
        
        initialize : function(options) {
            
            console.log('app init: ', this);
            // Current user collection
            this.users = new Models.UserCollection();
            this.users.url = this.url() + ':users';
            
            // Active chat collection
            this.chats = new Models.ChatCollection();
            this.chats.url = this.url() + ':chats';
            
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
					self.chats.subscribe(params, function(resp) {
                    
						// Set a model for each id found for lookups
						_.each(self.attributes.chats, function(key) {
							self.chats.add({id : key}, {silent : true});
						});
						
						// Use backbone to fetch from the server
						self.chats.each(function(chat) {
						
                            var params = {
                                error    : function(msg, resp, opt){},
                                finished : function(data) {
                                    self.chats.add(data);
                                },
                            };
							chat.fetch(params);
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