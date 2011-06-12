(function(ß) {
    // Application model
    // -----------------
    
    ß.Models.ApplicationModel = Backbone.Model.extend({
    
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
            this.users = new ß.Models.UserCollection();
            this.users.url = this.url() + ':users';
            
            // Active room collection
            this.rooms = new ß.Models.RoomCollection();
            this.rooms.url = this.url() + ':rooms';
            
            // Create a new user for the current client, only the 
            // defaults will be used until the client authenticates
            // with valid credentials
            ß.user = new ß.Models.UserModel();
            
            // Conversations collections
            ß.user.conversations = new ß.Models.ConversationCollection();
            ß.user.conversations.url = this.url() + ':conversations';
            
            // Wait for three executions of history() before
            // starting, ensuring that rooms and users are loaded before
            // trying to execute the current hash location
            var history = _.after(3, function() {
                Backbone.history.start();
            });
            
            // Subscribing to a model can be continued by just 
            // passing a callback, though, it will still execute a
            // 'finished' function if you pass one in theim n options
            var self = this;
            
            // Sync up with the ß.Server through DNode, Backbone will
            // supply the channel url if one is not supplied
            this.rooms.subscribe({}, function(resp) {
                self.rooms.fetch({
                    query    : {},
                    error    : function(code, msg, opt) {},
                    finished : function(resp) {
                        history();
                    },
                });
            });
            
            // Sync up with the ß.Server through DNode, Backbone will
            // supply the channel url if one is not supplied
            this.users.subscribe({}, function(resp) {
                self.users.fetch({
                    query    : {},
                    error    : function(code, msg, opt) {},
                    finished : function(resp) {
                        console.log('users fetched');
                        history();
                        
                        var params = {
                            token : self.view.sid,
                            error : function(code, data, options) {
                            },
                        };
                        ß.Server.getSession({}, params, function(session, options) {
                        
                            console.log('got session');
                            if (!session) return;
                            options.password && (session.password = options.password);
                            session = ß.Helpers.getMongoId(session);
                            
                            ß.user.set(session);
                            ß.user.url = self.url() + ':users:' + session.id;
                            ß.user.subscribe({}, function(resp) {
                            
                                // Current user bindings
                                ß.user.friends.bind('add', self.view.addFriend);
                                ß.user.friends.bind('refresh', self.view.allFriends);
                                
                                ß.user.favorites.bind('add', self.view.addFavorite);
                                ß.user.favorites.bind('refresh', self.view.allFavorites);
                            
                                ß.user.collection = self.users;
                                ß.user.loadFriends()
                                ß.user.loadFavorites();
                                    
                                console.log('BLAH');
                            });
                            
                            history();
                            session._id && self.view.toggleNav();
                            
                            // Sync up with the ß.Server through DNode, Backbone will
                            // supply the channel url if one is not supplied
                            /**
                            ß.user.conversations.subscribe({}, function(resp) {
                                console.log('Conversation subbed', resp);
                                ß.user.conversations.fetch({
                                    query    : {},
                                    error    : function(code, msg, opt) {},
                                    finished : function(resp) {
                                        console.log('Conversation fetched', resp);
                                    },
                                });
                            });
                            **/
                            
                            ß.Server.onlineUsers(function(resp) {
                                console.log('onlineUsers: ', resp);
                            });
                            
                            ß.Server.activeSessions(function(resp) {
                                console.log('activeSessions: ', resp);
                                
                                this.online = resp.length || 0;
                            });
                        });
                    },
                });
            });
            
            // Wait a while and then force-start history, on the off chance
            // that no users or rooms were loaded
            _.delay(function() {
                try {
                    Backbone.history.start();
                } catch (error) {
                    // Error's only occur when we try to 
                    // re-start backbone history
                }
            }, 5000);
        }
    });
    
})(ß)