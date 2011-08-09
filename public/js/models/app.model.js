//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // Application model
    // -----------------
    
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Models = root.Models;
    if (typeof Models === 'undefined') Models = root.Models = {};
    if (typeof exports !== 'undefined') module.exports = Models;
    
    // Extend the Backbone 'model' object and add it to the 
    // namespaced model container
    Models.ApplicationModel = Backbone.Model.extend({
    
        // Server communication settings
        type     : 'application',
        urlRoot  : 'app',
        
        //###initialize
        // Model constructor
        initialize : function(options) {
            this.server = options.server;
            
            // Current user collection
            this.users     = new Models.UserCollection();
            this.users.url = this.url() + ':users';
            
            // Active room collection
            this.rooms     = new Models.RoomCollection();
            this.rooms.url = this.url() + ':rooms';
            
            // Create a new user for the current client, only the 
            // defaults will be used until the client authenticates
            // with valid credentials
            root.user = new Models.UserModel();
            
            // Conversations collections
            root.user.conversations     = new Models.ConversationCollection();
            root.user.conversations.url = this.url() + ':conversations';
            
            // Wait for three executions of history() before
            // starting, ensuring that rooms and users are loaded before
            // trying to execute the current hash location
            
            var history = _.after(2, function() {
                Backbone.history.start();
            });
            var self = this;
            
            // Sync up with the Server through DNode, Backbone will
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
            
            // Subscribing to a model can be continued by just 
            // passing a callback, though, it will still execute a
            // 'finished' function if you pass one in theim n options
            this.users.subscribe({}, function(resp) {
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
                        Server.getSession({}, params, function(session, options) {
                        
                            if (!session) return;
                            options.password && (session.password = options.password);
                            session = _.getMongoId(session);
                            
                            root.user.set(session);
                            root.user.url = self.url() + ':users:' + session.id;
                            root.user.subscribe({}, function(resp) {
                            
                                // Current user bindings
                                root.user.friends.bind('add', self.view.addFriend);
                                root.user.friends.bind('reset', self.view.allFriends);
                                
                                root.user.favorites.bind('add', self.view.addFavorite);
                                root.user.favorites.bind('reset', self.view.allFavorites);
                            
                                root.user.collection = self.users;
                                root.user.loadFriends()
                                root.user.loadFavorites();
                            });
                            
                            session._id && self.view.toggleNav();
                            
                            // Sync up with the Server through DNode, Backbone will
                            // supply the channel url if one is not supplied
                            /**
                            root.user.conversations.subscribe({}, function(resp) {
                                console.log('Conversation subbed', resp);
                                root.user.conversations.fetch({
                                    query    : {},
                                    error    : function(code, msg, opt) {},
                                    finished : function(resp) {
                                        console.log('Conversation fetched', resp);
                                    },
                                });
                            });
                            **/
                            
                            // Testing mechanics for retrieving the 
                            // number of all current connections
                            Server.onlineUsers(function(resp) {
                            });
                            
                            Server.activeSessions(function(resp) {
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
        },
        
        //###createRoom
        // Create a new room
        createRoom : function(attr) {
            if (!attr) return;
            this.rooms.create(attr, {
                error    : function(msg, resp, options) {},
                finished : function(resp) {
                }
            });
        },
    });

}).call(this)
