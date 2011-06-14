(function(ß) {
    // User model
    // ------------------
    
    // User
    ß.Models.UserModel = Backbone.Model.extend({
        
        type     : 'user',
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
            this.friends   = new ß.Models.UserCollection();
            this.favorites = new ß.Models.RoomCollection();
            
            // Request a gravatar image for the current 
            // user based on email address if not default
            if (this.get('avatar') === this.defaults.avatar) {
                var self = this;
                ß.Server.gravatar({
                    email : self.get('email'),
                    size  : 30
                }, function(resp) {
                    self.set({ avatar : resp });
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
            ß.Server.logout(this.toJSON(), options);
            this.trigger('logout');
        },
        
        // Authenticate the current user model
        authenticate : function(data, options, next) {
            var self = this;
            options.type = this.type;
            
            // Update the current model with the returned data, 
            // increase total visits, and chage the status to 'online'
            ß.Server.authenticate(data, options, function(resp) {
                self.set(resp);
                self.save({
                    visits : self.get('visits') + 1,
                    status : 'online',
                });
                self.loadFriends();
                next && next(resp);
            });
        },
        
        // Register model with the ß.Server
        register : function(data, options, next) {
            var self = this;
            options.type = this.type;
            
            // Update the current model with the returned data, 
            // increase total visits, and chage the status to 'online'
            ß.Server.register(data, options, function(resp) {
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
            var from = ß.user.get('id') || ß.user.get('_id');
            var key = (to > from) 
                    ? to + ':' + from
                    : from + ':' + to;
            
            if (!ß.user.conversations.get(key)) {
            
                var convo = new ß.Models.ConversationModel({
                    to   : to,
                    id   : key,
                    name : this.get('displayName') || this.get('username')
                });
                convo.url = 'pm:' + key;
                
                ß.Server.startConversation(ß.user.toJSON(), {
                    channel : convo.url,
                    id      : to
                }, function(resp, options) {
                    // Conversation started
                    ß.user.conversations.add(convo);
                });
            }
        },
    });
    
    // User Collection
    ß.Models.UserCollection = Backbone.Collection.extend({
        
        model : ß.Models.UserModel,
        type  : 'user',
        url   : 'users',
        
        // Initialize
        initialize : function(options) {
        }
    });
})(ß)