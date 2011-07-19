//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

//(function() {
    // User model
    // ----------
    
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Models = root.Models;
    if (typeof Models === 'undefined') Models = root.Models = {};
    if (typeof exports !== 'undefined') module.exports = Models;
    
    // User
    Models.UserModel = Backbone.Model.extend({
        
        // Server communication settings
        type : 'user',
        sync : _.sync,
        
        // Model defaults
        defaults : {
            username  : 'anonymous',
            avatar    : '/images/undefined.png',
            status    : 'offline',
            email     : '',
            created   : '',
            modified  : '',
            bio       : '',
            friends   : [],
            images    : [],
            favorites : [],
            password  : '',
            visits    : 0
        },
        
        initialize : function(options) {
            // Add friends list
            this.friends   = new Models.UserCollection();
            this.favorites = new Models.RoomCollection();
            
            // Request a gravatar image for the current 
            // user based on email address if not default
            if (this.get('avatar') !== this.defaults.avatar) {
                var self = this;
                Server.gravatar({
                    email    : self.get('email'),
                    size     : 30,
                    finished : function(resp) {
                        self.set({ avatar : resp });
                    }
                }, function(resp) {
                    // Placeholder
                });
            }
        },
        
        loadFriends : function() {
            var self = this;
            this.friends.url = this.url + ':friends';
            this.friends.subscribe({}, function(resp) {
                if (!self.get('friends')) {
                    return;
                }
                self.friends.fetch({
                    query : { _id : { $in : self.get('friends') }},
                });
            });
            return this;
        },
        
        loadFavorites : function() {
            var self = this;
            this.favorites.url = this.url + ':favorites';
            this.favorites.subscribe({}, function(resp) {
                if (!self.get('favorites')) {
                    return;
                }
                self.favorites.fetch({
                    query : { _id : { $in : self.get('favorites') }},
                });
            });
            return this;
        },
        
        logout : function(options) {
            Server.logout(this.toJSON(), options);
            this.trigger('logout');
        },
        
        // Authenticate the current user model
        authenticate : function(data, options, next) {
            var self = this;
            options.type = this.type;
            
            // Update the current model with the returned data, 
            // increase total visits, and chage the status to 'online'
            Server.authenticate(data, options, function(resp) {
                self.set(resp);
                self.save({
                    visits : self.get('visits') + 1,
                    status : 'online',
                });
                self.loadFriends();
                next && next(resp);
            });
        },
        
        // Register model with the Server
        register : function(data, options, next) {
            var self = this;
            options.type = this.type;
            
            // Update the current model with the returned data, 
            // increase total visits, and chage the status to 'online'
            Server.register(data, options, function(resp) {
                self.set(resp);
                self.save({
                    visits : self.get('visits') + 1,
                    status : 'online',
                });
                self.loadFriends();
                next && next(resp);
            });
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            this.posts && this.posts.unsubscribe();
        },
        
        startConversation : function() {
            var to = this.get('id');
            var from = user.get('id') || user.get('_id');
            var key = (to > from) 
                    ? to + ':' + from
                    : from + ':' + to;
            
            if (!root.user.conversations.get(key)) {
            
                var convo = new Models.ConversationModel({
                    to   : to,
                    id   : key,
                    name : this.get('displayName') || this.get('username')
                });
                convo.url = 'pm:' + key;
                
                Server.startConversation(user.toJSON(), {
                    channel : convo.url,
                    id      : to
                }, function(resp, options) {
                    // Conversation started
                    root.user.conversations.add(convo);
                });
            }
        },
    });
    
    // User Collection
    Models.UserCollection = Backbone.Collection.extend({
        
        model : Models.UserModel,
        
        // Server communication settings
        type : 'user',
        url  : 'users',
        sync : _.sync
    });
//})()
