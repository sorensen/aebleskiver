//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // User views
    // ----------
    
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Views;
    if (typeof exports !== 'undefined') {
        Views = exports;
    } else {
        Views = this.Views || (this.Views = {});
    }
    
    //##User
    // Basic user view, used primarily for the list view 
    // representation, basic view to build upon
    Views.UserView = Backbone.View.extend({
    
        // DOM attributes
        tagName   : 'div',
        className : 'user inactive',
        template  : _.template($('#user-list-template').html()),
        
        // User interaction events
        events : {
            'click' : 'activate'
        },
        
        //###initialize
        // View constructor
        initialize : function(options) {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
            this.model.bind('remove', this.clear);
            this.model.view = this;
            this.render();
        },
    
        //###render
        // Create the DOM representation of this view, sending 
        // model contents to the template, creating DOM shortcuts, 
        // and applying all style effects to the view
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
        
        //###remove
        // Remove this view from the DOM.
        remove : function() {
            this.el.remove();
        },
        
        //###activate
        // Join Channel
        activate : function() {            
            $(this.el)
                .addClass('current')
                .removeClass('inactive')
                .siblings()
                    .addClass('inactive')
                    .removeClass('current');
        }
    });
    
    //##Friend
    // Specific view of a user representing a 'friend', 
    // seperated to apply different styles
    Views.FriendView = Views.UserView.extend({
    
        // DOM attributes
        tagName   : 'div',
        className : 'user friend',
        template  : _.template($('#friend-list-template').html()),
        
        // User interaction events
        events : {
            'click' : 'startConversation',
        },
        
        //###startConversation
        // Force the 'friend' user into a conversation
        // with current user through RPC delegation
        startConversation : function() {
            this.model.startConversation();
        }
    });
    
    //##
    // User profile and wall
    Views.UserMainView = Backbone.View.extend({
    
        // DOM attributes
        tagName        : 'div',
        className      : 'user-profile',
        template       : _.template($('#user-template').html()),
        statsTemplate  : _.template($('#user-stats-template').html()),
        
        // User interaction events
        events : {
            'keypress .post-form input' : 'createPostOnEnter',
            'click #post-submit'        : 'createPost',
            'click #leave-profile'      : 'deactivate',
            'click #add-friend'         : 'addToFriends',
            'click #remove-friend'      : 'removeFromFriends',
            'click #send-message'       : 'startConversation'
        },
    
        //##initialize
        // Setup the model and view interactions, unlike the 'events' 
        // property, the event bindings below are programmatic listeners
        // to model and collection changes
        initialize : function(options) {
            _.bindAll(this, 
                'statistics', 'allPosts', 'addPost', 'createPost'
            );
            this.model.bind('change', this.statistics);
            this.model.bind('remove', this.remove);
            
            this.model.posts     = new Models.MessageCollection();
            this.model.posts.url = this.model.url() + ':posts';
            
            this.model.posts.bind('add',   this.addPost);
            this.model.posts.bind('reset', this.allPosts);
            this.model.posts.bind('add',   this.statistics);
            
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
            
            this.render();
            
            // Subscribe to the user's message wall for 
            // changes and new messages
            this.model.posts.subscribe({}, function() {
                self.model.posts.fetch({
                    query    : {room_id : self.model.get('id')},
                    finished : function(data) {
                    },
                });
            });
            return this;
        },
        
        //###render
        // Create the DOM representation of this view, sending 
        // model contents to the template, creating DOM shortcuts, 
        // and applying all style effects to the view
        render : function() {
            var content = this.model.toJSON(),
                view    = Mustache.to_html(this.template(), content);   
            
            $(this.el)
                .html(view)
                .find('[title]')
                .wijtooltip();
            
            // Set shortcut methods for DOM items
            this.input    = this.$('.create-post');
            this.postList = this.$('.posts');
            this.input.focus();
        },
        
        //###remove
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            this.model && this.model.remove();
            $(this.el).remove();
        },
    
        //###statistics
        // Refresh the view with new statistical values
        statistics : function() {
            var totalPosts = this.model.posts.length;
            this.$('.user-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalPosts : totalPosts
            }));
            return this;
        },
        
        //###startConversation
        // Force the 'friend' user into a conversation
        // with current user through RPC delegation
        startConversation : function() {
            this.model.startConversation();
        },
        
        //###addToFriends
        // Add user to current user's friend list
        addToFriends : function() {
            if (this.model.get('id') == user.get('id')
                || this.model.get('id') == user.id) {
                return;
            }
            var friends = user.get('friends') || [],
                find    = _.indexOf(friends, this.model.get('id'));
            
            if (find !== -1) {
                return;
            }
            friends.push(this.model.get('id'));
            
            // Make sure we are not duplicating any friends by 
            // ensuring that the array of keys is unique
            user.set({
                friends : _.unique(friends)
            }).save();
            
            user.friends.add(this.model);
        },
        
        //###removeFromFriends
        // Delete user from current user's friend list
        removeFromFriends : function() {
            var id      = this.model.get('id'),
                friends = _.without(user.get('friends'), id),
                person  = user.friends.get(id);
            
            // Make sure we have a valid user
            if (!person) {
                return false;
            }
            
            // Remove DOM element from view
            $(person.view.el).remove();
            
            // Remove from model and save to server
            user.friends
                .remove(this.model, {
                    silent : true
                })
                .set({
                    friends : friends
                })
                .save();
        },
        
        //###activate
        // Join Channel
        activate : function() {            
            $(this.el)
                .addClass('current')
                .removeClass('inactive')
                .siblings()
                    .addClass('inactive')
                    .removeClass('current');
        },
        
        //###deactivate
        // Tell the application to remove this room
        deactivate : function() {
            Backbone.history.saveLocation('/');
            this.view.deactivateUser(this.model);
        },
        
        //###allPosts
        // All rooms have been loaded into collection
        allPosts : function(posts) {
            this.postList.html('');
            this.model.posts.each(this.addPost);
        },
        
        //###addPost
        // Add a single post (message) to the user's wall
        addPost : function(post) {
            var view = new Views.MessageView({
                model : post
            }).render();
            
            this.postList
                .append(view.el)
                .scrollTop(this.postList[0].scrollHeight);
        },
        
        //###createPost
        // Send a post to the Server
        createPost : function() {
            if (!this.input.val()) return;
            this.model.posts.create(this.newAttributes());
            this.input.val('');
        },
        
        //###createPostOnEnter
        // Create post keystroke listener
        createPostOnEnter : function(e) {
            if (e.keyCode == 13) this.createPost();
        },
        
        //###newAttributes
        // Generate the attributes for creating a post
        newAttributes : function() {
            var username    = user.get('username'),
                displayName = user.get('displayName') || user.get('username'),
                id          = user.get('id') || user.id;
            
            return {
                text        : this.input.val(),
                room_id     : this.model.get('id'),
                user_id     : id,
                username    : username,
                displayName : displayName,
                avatar      : user.get('avatar')
            };
        }
    });
})()