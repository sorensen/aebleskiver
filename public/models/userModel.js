(function(Models) {
    // User model
    // ------------------
    
    // User
    Models.UserModel = Backbone.Model.extend({
        
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
            this.friends = new Models.UserCollection();
            this.favorites = new Models.RoomCollection();
            
            // Request a gravatar image for the current 
            // user based on email address if not default
            if (this.get('avatar') === this.defaults.avatar) {
                var self = this;
                Server.gravatar({
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
        
        // Register model with the server
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
    });
    
    // User Collection
    Models.UserCollection = Backbone.Collection.extend({
        
        model : Models.UserModel,
        type  : 'user',
        url   : 'users',
        
        // Initialize
        initialize : function(options) {
        }
    });

})(Models)