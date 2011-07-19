//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

//(function() {
    // Application view
    // -----------------
    
    // Save a reference to the global object.
    var root = this;
  
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Views = root.Views;
    if (typeof Views === 'undefined') Views = root.Views = {};
    if (typeof exports !== 'undefined') module.exports = Views;
    
    // Extend the Backbone 'view' object and add it to the 
    // namespaced view container
    Views.FooterView = Backbone.View.extend({
        
        //##Interaction events
        // These are all interaction events between the 
        // user and this view's DOM interface
        events : {
            'click #friend-list .icon'   : 'toggleFriendList',
            'click #favorite-list .icon' : 'toggleFavoriteList',
            'click #start-menu .icon'    : 'toggleSidebar'
        },
        
        //##initialize
        // Setup the model and view interactions, unlike the 'events' 
        // property, the event bindings below are programmatic listeners
        // to model and collection changes
        initialize : function(options) {
            _.bindAll(this, 
                'render', 'statistics', 'toggleSidebar',
                'toggleFriendList', 'allFriends', 'addFriend',
                'toggleFavoriteList', 'allFavorites', 'addFavorite',
                'conversationsReady', 'allConversations', 'addConversation'
            );
            this.model.footer = this;
            
            // Conversation event bindings
            root.user.conversations.bind('subscribe', this.coversationsReady);
            root.user.conversations.bind('add',       this.addConversation);
            root.user.conversations.bind('reset',     this.allConversation);
            
            this.render();
            
            // Set shortcuts to collection DOM
            this.friends          = this.$('#friend-list');
            this.friendList       = this.$('.friends');
            this.favorites        = this.$('#favorite-list');
            this.favoriteList     = this.$('.favorites');
            this.conversationList = this.$('#conversations');
            
            // Internal sidebar settings, pull settings
            // from the cookie and bootstrap if required
            this.friendsOpen   = $.cookie('friendsOpen')   || 'false';
            this.favoritesOpen = $.cookie('favoritesOpen') || 'false';
            
            if (this.friendsOpen === 'true') {
                this.friends.addClass('open');
            }
            if (this.favoritesOpen === 'true') {
                this.favorites.addClass('open');
            }
        },
        
        //###render
        // Render template contents onto the DOM, adding
        // any effects afterwards, such as icons
        render : function() {
            _.icon('power',      'start-menu-icon');
            _.icon('slideshare', 'friends-icon');
            _.icon('bookmark',   'favorites-icon');
            _.icon('i',          'stats-icon');
            _.icon('github',     'github-icon');
            _.icon('chat',       'show-rooms');
            _.icon('users',      'show-users');
            
            return this;
        },
        
        //###toggleSidebar
        // Open or close the sidebar menu, setting a cookie
        // to remember the setting
        toggleSidebar : function() {
            if (this.menuOpen == 'true') {
                this.menuOpen = 'false';
                $(this.el).removeClass('menuOpen');
            }
            else {
                this.menuOpen = 'true';
                $(this.el).addClass('menuOpen');
            }
            $.cookie('menuOpen', this.menuOpen);
        },
        
        //###toggleFriendList
        // Open or close the friend list, setting a cookie
        // to remember the setting
        toggleFriendList : function() {
            if (this.friendsOpen == 'true') {
                this.friendsOpen = 'false';
                this.friends.removeClass('open');
            }
            else {
                this.friendsOpen = 'true';
                this.friends.addClass('open');
                
                if (this.favoritesOpen == 'true') {
                    this.favoritesOpen = 'false';
                    this.favorites.removeClass('open');
                }
            }
            $.cookie('favoritesOpen', this.favoritesOpen);
            $.cookie('friendsOpen', this.friendsOpen);
        },
        
        //###allFriends
        // All rooms have been loaded into collection
        allFriends : function(friends) {
            this.friendList.html('');
            user.friends.each(this.addFriend);
            
            // Refresh model statistics
            this.statistics();
        },
        
        //###addFriend
        // Add a single friend o the current veiw
        addFriend : function(friend) {
            var view = new Views.FriendView({
                model : friend
            }).render();
            
            this.friendList
                .append(view.el);
        },
        
        //###toggleFavoriteList
        // See: toggleFriendList for explanation
        toggleFavoriteList : function() {
            if (this.favoritesOpen == 'true') {
                this.favoritesOpen = 'false';
                this.favorites.removeClass('open');
            }
            else {
                this.favoritesOpen = 'true';
                this.favorites.addClass('open');
                
                if (this.friendsOpen == 'true') {
                    this.friendsOpen = 'false';
                    this.friends.removeClass('open');
                }
            }
            $.cookie('favoritesOpen', this.favoritesOpen);
            $.cookie('friendsOpen', this.friendsOpen);
        },
        
        //###allFavorites
        // All rooms have been loaded into collection
        allFavorites : function(favorites) {
            this.favoriteList.html('');
            user.favorites.each(this.addFavorite);
            
            // Refresh model statistics
            this.statistics();
        },
        
        //###addFavorite
        // Add a single room room to the current veiw
        addFavorite : function(favorite) {
            var view = new Views.RoomView({
                model : favorite
            }).render();
            
            this.favoriteList
                .append(view.el);
        },
        
        //###conversationsReady
        // Conversations have been subscribed to
        conversationsReady : function(resp) {
            // Placeholder
        },
        
        //###allConversations
        // All rooms have been loaded into collection
        allConversations : function(friends) {
            this.conversationList.html('');
            root.user.conversations.each(this.addConversation);
        },
        
        //###addConversation
        // Add a single friend o the current veiw
        addConversation : function(convo) {
            var view = new Views.ConversationView({
                model : convo
            }).render();
            
            this.conversationList
                .append(view.el);
        }
    });
//})()