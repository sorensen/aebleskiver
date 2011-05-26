(function(Models) {
    // Application model
    // -----------------
    
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
            this.rooms.create(attr, {
                error    : function(msg, resp, options) {},
                finished : function(resp) {
                }
            });
        },
        
        initialize : function(options) {
            
            // Current user collection
            this.users = new Models.UserCollection();
            this.users.url = this.url() + ':users';
            
            // Active room collection
            this.rooms = new Models.RoomCollection();
            this.rooms.url = this.url() + ':rooms';
            
            // Conversations collections
            window.conversations = new Models.ConversationCollection();
            window.conversations.url = this.url() + ':conversations';
            
            var self = this;
            // Subscribing to a model can be continued by just 
            // passing a callback, though, it will still execute a
            // 'finished' function if you pass one in theim n options
            this.subscribe({}, function(resp) {
                var history = _.after(3, function() {
                    Backbone.history.start();
                });
                // Sync up with the server through DNode, Backbone will
                // supply the channel url if one is not supplied
                self.rooms.subscribe({}, function(resp) {
                    self.rooms.fetch({
                        query    : {},
                        error    : function(code, msg, opt) {},
                        finished : function(resp) {
                            history();
                        },
                    });
                });
                
                // Sync up with the server through DNode, Backbone will
                // supply the channel url if one is not supplied
                self.users.subscribe({}, function(resp) {
                    self.users.fetch({
                        query    : {},
                        error    : function(code, msg, opt) {},
                        finished : function(resp) {
                            history();
                            
                            var params = {
                                token : self.view.sid,
                                error : function(code, data, options) {
                                },
                            };
                            Server.getSession(window.user.toJSON(), params, function(session, options) {
                                
                                if (!session) return;
                                options.password && (session.password = options.password);
                                session = Helpers.getMongoId(session);
                                
                                window.user.set(session);
                                window.user.url = self.url() + ':users:' + session.id;
                                window.user.collection = self.users;
                                window.user.loadFriends();
                                
                                history();
                                session._id && self.view.toggleNav();
                                
            
                                Server.onlineUsers(function(resp) {
                                    console.log('onlineUsers: ', resp);
                                });
                                
                                Server.activeSessions(function(resp) {
                                    console.log('activeSessions: ', resp);
                                });
                            });
                        },
                    });
                });
                
                _.delay(function() {
                    try {
                        Backbone.history.start();
                    } catch (error) {
                        // Error's only occur when we try to 
                        // re-start backbone history
                    }
                }, 3000);
            });
        }
    });
    
})(Models)