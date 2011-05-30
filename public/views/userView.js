(function(Views) {
    // User views
    // -----------------
    
    // User ( Client )
    Views.UserView = Backbone.View.extend({
    
        // DOM attributes
        tagName   : 'div',
        className : 'user inactive',
        template  : _.template($('#user-list-template').html()),
        
        // Interaction events
        events : {
            'click' : 'activate'
        },
    
        initialize : function(options) {
            _.bindAll(this, 'render');
            
            this.model.bind('change', this.render);
            this.model.bind('remove', this.clear);
            this.model.view = this;
            
            this.render();
        },
    
        // Re-render contents
        render : function() {
            var content = this.model.toJSON();
            if (content.username === 'anonymous') {
                content.displayName || (content.displayName = content.username);
                content.username = content.id;
            }
            var view = Mustache.to_html(this.template(), content);
            $(this.el).html(view);
            return this;
        },
        
        // Remove this view from the DOM.
        remove : function() {
            this.el.remove();
        },
        
        // Join Channel
        activate : function() {            
            $(this.el)
                .addClass('current')
                .removeClass('inactive')
                .siblings()
                .addClass('inactive')
                .removeClass('current');
        },
    });
    
    Views.FriendView = Views.UserView.extend({
    
        // DOM attributes
        tagName   : 'div',
        className : 'user friend',
        template  : _.template($('#friend-list-template').html()),
        
        // Interaction events
        events : {
            'click' : 'startConversation',
        },
        
        startConversation : function() {
            this.model.startConversation();
        },
        
    });
    
    // User ( Client )
    Views.UserMainView = Backbone.View.extend({
    
        // DOM attributes
        tagName        : 'div',
        className      : 'user-profile',
        template       : _.template($('#user-template').html()),
        statsTemplate  : _.template($('#user-stats-template').html()),
        
        // Interaction events
        events : {
            'keypress .post-form input' : 'createPostOnEnter',
            'click .post-form button'   : 'createPost',
            'click .destroy'            : 'deactivate',
            'click .add-friend'         : 'addToFriends',
            'click .remove-friend'      : 'removeFromFriends',
            'click .send-message'       : 'startConversation'
        },
    
        initialize : function(options) {
            _.bindAll(this, 
                'render', 'allPosts', 'addPost', 'createPost'
            );
            this.model.bind('change', this.render);
            this.model.bind('remove', this.remove);
            
            this.model.posts = new Models.MessageCollection();
            this.model.posts.url = this.model.url() + ':posts';
            
            this.model.posts.bind('add', this.addPost);
            this.model.posts.bind('refresh', this.allPosts);
            this.model.posts.bind('add', this.render);
            
            this.model.view = this;
            
            var self = this;
            // Request a gravatar image for the current 
            // user based on email address
            Server.gravatar({
                email : self.model.get('email'),
                size  : 100
            }, function(resp) {
                self.model.set({ avatar : resp });
            });
            
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);   
            $(this.el).html(view);
            
            // Set shortcut methods for DOM items
            this.input    = this.$('.create-post');
            this.postList = this.$('.posts');
            this.input.focus();
            
            var self = this;
            this.model.posts.subscribe({}, function() {
                self.model.posts.fetch({
                    query    : {room_id : self.model.get('id')},
                    finished : function(data) {
                    },
                });
            });
            return this;
        },
        
        startConversation : function() {
            this.model.startConversation();
        },
        
        addToFriends : function() {
            if (this.model.get('id') == window.user.get('id')
                || this.model.get('id') == window.user.id) {
                return;
            }
            
            var friends = window.user.get('friends') || [];            
            var find = _.indexOf(friends, this.model.get('id'));
            
            if (find !== -1) {
                return;
            }
            friends.push(this.model.get('id'));
            
            window.user.set({
                friends : _.unique(friends)
            }).save();
            
            window.user.friends.add(this.model);
        },
        
        removeFromFriends : function() {
            var id = this.model.get('id');
            var friends = _.without(window.user.get('friends'), id);
            
            var person = window.user.friends.get(id);
            $(person.view.el).remove();
            
            window.user.friends
                .remove(this.model, {
                    silent : true
                })
                .set({
                    friends : friends
                })
                .save();
        },
    
        // Render contents
        render : function() {
            var totalPosts = this.model.posts.length;
            this.$('.user-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalPosts : totalPosts
            }));
            return this;
        },
        
        // Remove this view from the DOM.
        remove : function() {
            this.model && this.model.remove();
            $(this.el).remove();
        },
        
        // Join Channel
        activate : function() {            
            $(this.el)
                .addClass('current')
                .removeClass('inactive')
                .siblings()
                .addClass('inactive')
                .removeClass('current');
        },
        
        // Tell the application to remove this room
        deactivate : function() {
            Backbone.history.saveLocation('/');
            Application.deactivateUser(this.model);
        },
        
        // All rooms have been loaded into collection
        allPosts : function(posts) {
            this.postList.html('');
            this.model.posts.each(this.addPost);
            this.render();
        },
        
        addPost : function(post) {
            var view = new Views.MessageView({
                model : post
            }).render();
            
            this.postList
                .append(view.el)
                .scrollTop(this.postList[0].scrollHeight);
        },
        
        // Send a post to the server
        createPost : function() {
            if (!this.input.val()) return;
            this.model.posts.create(this.newAttributes());
            this.input.val('');
        },
        
        // Create post keystroke listener
        createPostOnEnter : function(e) {
            if (e.keyCode == 13) this.createPost();
        },
        
        // Generate the attributes
        newAttributes : function() {
            var username = window.user.get('username');
            var id = window.user.get('id') || window.user.id;
            
            return {
                text        : this.input.val(),
                room_id     : this.model.get('id'),
                user_id     : id,
                username    : (username == Models.UserModel.defaults) ? id : window.user.get('username'),
                displayName : window.user.get('displayName') || window.user.get('username'),
                avatar      : window.user.get('avatar')
            };
        },
    });

})(Views)