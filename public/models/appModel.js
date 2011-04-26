(function(Models) {
    // Application model
    // -----------------
    
    // World Model
    Models.ApplicationModel = Backbone.Model.extend({
    
        type     : 'application',
        urlRoot  : 'app',
        
        defaults : {
            server  : 's1',
            visits  : 0,
            users   : [],
            rooms   : []
        },
        
        createRoom : function(attr) {
            if (!attr) return;
            var self = this;
            this.rooms.create(attr, {
                error    : function(msg, resp, options) {},
                finished : function(resp) {
                    var keys = self.get('rooms');
                    if (keys) {
                        keys.push(resp.id);
                        if (keys.length > 50) keys = _.rest(keys, (keys.length - 50));
                        self.save({rooms : _.uniq(keys)}, {
                            error : function(msg, resp, options) {},
                        });
                        delete keys;
                    }
                }
            });
        },
        
        initialize : function(options) {
            
            // Grab the authentication token and remove it from the DOM
            var sid = $('#token').html();
            
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
            // 'finished' function if you pass one in theim n options
            this.subscribe(params, function(resp) {
            
                var next = function() {
                    // Sync up with the server through DNode, Backbone will
                    // supply the channel url if one is not supplied
                    self.rooms.subscribe({}, function(resp) {
                    
                        self.rooms.fetch({
                            query : {},
                            error : function(code) { 
                                console.log('fetch error', code); 
                            },
                            success : function(resp) {
                                console.log('rooms fetched', resp);
                            },
                        });
                        
                        /**
                        // Total number of objects for lookup
                        var total = self.attributes.rooms.length;
                        console.log('total: ', total);
                        
                        if (total === 0) Backbone.history.start();
                        
                        // Set a model for each id found for lookups
                        _.each(self.attributes.rooms, function(key) {
                            self.rooms.add({id : key}, {silent : true});
                        });
                        
                        // Use backbone to fetch from the server
                        var x = 0;
                        self.rooms.each(function(room) {
                            room.fetch({
                                error    : function(msg, resp, opt){},
                                finished : function(data) {
                                    self.rooms.add(data);
                            
                                    // Check for last object
                                    x++;
                                    if (x === total) self.rooms.trigger('refresh');
                                },
                            });
                        });
                        **/
                    });
                    
                    var params = {
                        
                    };
            
                    // Start history once we have model data
                    //Backbone.history.start();
                    
                    // Sync up with the server through DNode, Backbone will
                    // supply the channel url if one is not supplied
                    self.users.subscribe(params, function(resp) {
                    
                        // Create a new user for the current client, only the 
                        // defaults will be used until the client authenticates
                        // with valid credentials
                        window.user = new Models.UserModel();
                        
                        var params = {
                            token : sid,
                            error : function(code, data, options) {
                            
                                console.log('get user error: code: ', code);
                                console.log('get user error: data: ', data);
                                console.log('get user error: options: ', options);
                                
                                switch(code) {
                                    case 400 : console.log('Bad parameters'); break;
                                    case 500 : console.log('Internal server error'); break;
                                }
                            },
                        };
                        Server.getSession(window.user.toJSON(), params, function(session, options) {
                            if (!session) return;
                            
                            keys = self.attributes.users;
                            console.log('keys: ', keys);
                            
                            if (session.user) {
                                window.user.set(session.user);
                                
                                console.log('session.user: ', window.user);
                                // Add user to the app lookup keys
                                //keys = _.without(keys, session.user.id);
                                //keys.push(session.user.id);
                                
                                //console.log('keys: ', keys);
                                //self.set({users: keys});
                            }
                            
                            self.users.fetch({
                                query : {status : 'online'},
                                error : function(code) { 
                                    console.log('users fetch error', code); 
                                },
                                success : function(resp) {
                                    console.log('users fetched', resp);
                                },
                            });
                            console.log('self: ', self);
                            
                            /**
                            // Set a model for each id found for lookups
                            _.each(keys, function(key) {
                                self.users.add({id : key}, {silent : true});
                            });
                            
                            // Use backbone to fetch from the server
                            self.users.each(function(room) {
                            
                                user.fetch({
                                    error    : function(code, resp, opt){
                                        console.log('fetch error', code);
                                        console.log('fetch error', resp);
                                    },
                                    finished : function(data) {
                                        self.users.add(data);
                                        console.log('user fetched: ', data);
                                    },
                                });
                            });
                            **/
                        });
                    });
                };
                self.fetch({
                    query    : {server : 's1'},
                    finished : function(resp) {
                        next();
                        // Increase the internal visit counter and 'update' the 
                        // model, this can be done through other analytic tools, 
                        // but this serves as a good demonstration for updating
                        self.save({visits : resp.visits + 1});
                    },
                    error : function() {
                        next();
                        // This should only be triggered the first time the 
                        // application is run, since a model must be created
                        // before it can be 'read' or 'updated'
                        self.save({visits : 1}, {force : true});
                    },
                });
            });
        }
    });
    
})(Models)