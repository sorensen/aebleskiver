//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Application model
// -----------------

(function() {
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

        // Use the MongoDB `id`
        idAttribute : '_id',
        
        //###initialize
        // Model constructor
        initialize : function(options) {
            var self = this;
            _.bindAll(this, 'setupUser');
            this.server = options.server;

            // Wait for three executions of history() before
            // starting, ensuring that rooms and users are loaded before
            // trying to execute the current hash location
            var history = _.after(2, function() {
                Backbone.history.start();
                self.view.loaded();
            });

            // Current user collection
            this.users = new Models.UserCollection();
            this.users.url = this.url() + ':users';
            this.users.fetch({
                query   : {},
                success : function(resp) {
                    history();
                }
            });
            
            // Active room collection
            this.rooms = new Models.RoomCollection();
            this.rooms.url = this.url() + ':rooms';
            this.rooms.fetch({
                query   : {},
                success : function(resp) {
                    history();
                }
            });

            this.setupUser(function() {
                self.users.subscribe();
                self.rooms.subscribe();
            });
            
            // Wait a while and then force-start history, on the off chance
            // that no users or rooms were loaded
            _.delay(function() {
                try {
                    Backbone.history.start();
                    self.view.loaded();
                } catch (error) {
                    // Error's only occur when we try to 
                    // re-start backbone history
                }
            }, 5000);
        },

        //###setupUser
        // Create a new user for the current client, only the 
        // defaults will be used until the client authenticates
        // with valid credentials
        setupUser : _.once(function(cb) {
            root.user = new Models.UserModel();
            root.user.conversations = new Models.ConversationCollection();
            root.user.conversations.url = this.url() + ':conversations';
            root.user.collection = this.users;

            var self = this;

            Server.getSession(root.user.toJSON(), {
                token : token
            }, function(session, options) {
                session = _.getMongoId(session);
                
                root.user.set(session);
                root.user.url = self.url() + ':users:' + session.id;

                root.user.loadFriends()
                root.user.loadFavorites();
                root.user.subscribe();
                root.user.trigger('session', session);
                /**
                root.user.conversations.subscribe();
                root.user.conversations.fetch();
                **/
                cb && cb(session);
            });
        })
    });

}).call(this)
