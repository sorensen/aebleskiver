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
    Views.SidebarView = Backbone.View.extend({
        
        //##Interaction events
        // These are all interaction events between the 
        // user and this view's DOM interface
        events : {
            'click #show-rooms' : 'showRooms',
            'click #show-users' : 'showUsers',
            'keypress #search'  : 'searchOnEnter',
            'click #search-now' : 'searchOnEnter',
        },
        
        //##initialize
        // Setup the model and view interactions, unlike the 'events' 
        // property, the event bindings below are programmatic listeners
        // to model and collection changes
        initialize : function(options) {
            _.bindAll(this, 
                'render', 'toggleNav', 'statistics', 'addRoom', 
                'createRoom', 'allRooms', 
                'roomsReady', 'addUser', 'allUsers', 'usersReady',
            );

            this.model.sidebar = this;
            
            // Application model event bindings
            this.model.bind('change',    this.statistics);
            
            // User collection event bindings
            this.model.users.bind('subscribe', this.usersReady);
            this.model.users.bind('add',       this.addUser);
            this.model.users.bind('change',    this.statistics);
            this.model.users.bind('reset',     this.allUsers);
            
            // Room collection event bindings
            this.model.rooms.bind('subscribe', this.roomsReady);
            this.model.rooms.bind('add',       this.addRoom);
            this.model.rooms.bind('change',    this.statistics);
            this.model.rooms.bind('reset',     this.allRooms);
            
            // Set shortcuts to collection DOM
            this.searchInput      = this.$('#search');
            this.userList         = this.$('#users');
            this.roomList         = this.$('#rooms');
            this.sidebar          = this.$('#sidebar');
            this.mainContent      = this.$('#main-content');
            
            // Internal sidebar settings, pull settings
            // from the cookie and bootstrap if required
            this.menuOpen = $.cookie('menuOpen')      || 'false';
            if (this.menuOpen === 'true') {
                $(this.el).addClass('menuOpen');
            }
        },
        
        //###render
        // Render template contents onto the DOM, adding
        // any effects afterwards, such as icons
        render : function() {
            _.icon('power', 'start-menu-icon');
            return this;
        },
        
        //###statistics
        // Update the DOM view with the current application
        // statistics, this method is seperated and short for use
        // whenever child collections are updated
        statistics : function() {
            var totalOnline = this.model.online       || 0,
                totalUsers  = this.model.users.length || 0,
                totalRooms  = this.model.rooms.length || 0;
            
            this.$('#app-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalOnline : totalOnline,
                totalUsers  : totalUsers,
                totalRooms  : totalRooms,
                version     : this.version
            }));
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
        
        //###searchOnEnter
        // Create room keystroke listener, throttled function
        // returned to reduce load on the 'Server'
        searchOnEnter : _.debounce(function() {
            var self  = this,
                input = this.searchInput.val(),
                query = (input.length < 1) ? {} : {
                    keywords : { $in : [ input ] }
                };
            
            this.model.rooms.fetch({
                query : query,
                error : function(code, msg, opt) {
                },
                finished : function(resp) {
                }
            });
            
        }, 1000),
        
        //###roomsReady
        // Room collection has been subscribed to
        roomsReady : function() {
            // Placeholder
        },
        
        //###allRooms
        // All rooms have been loaded into collection
        allRooms : function(rooms) {
            this.roomList.html('');
            this.model.rooms.each(this.addRoom);
            
            // Refresh model statistics
            this.statistics();
        },
        
        //###showRooms
        // Show the sidebar user list
        showRooms : function() {
            this.userList.fadeOut(150);
            this.roomList.fadeIn(150);
        },
        
        //###addRoom
        // Add a single room room to the current veiw
        addRoom : function(room) {
            var view = new Views.RoomView({
                model : room
            }).render();
            
            this.roomList
                .append(view.el);
            
            // Refresh model statistics
            this.statistics();
        },
        
        //###deactivateRoom
        // Remove the current active room from the view,
        // as well as the DOM
        deactivateRoom : function() {
            this.mainContent
                //.fadeOut(50, function(){
                //    $(this).html('');
                //});
                .hide()
                .html('');
            
            // Join Channel
            this.activeRoom && this.activeRoom.remove();
        },
        
        //###activateRoom
        // Set the target room to this view's active 
        // room, setting it to the main DOM view
        activateRoom : function(params) {
            // Should probably hide room instead, maybe 
            // minimize it to the bottom toolbar
            this.deactivateRoom();
            
            // Get model by slug
            var model = this.model.rooms.filter(function(room) {
                return room.get('slug') === params;
            });
            if (!model || !model[0]) {
                Backbone.history.saveLocation('/');
                return;
            }
            
            // Create a new main room view
            this.activeRoom = new Views.RoomMainView({
                model : model[0]
            });
            
            // Provide a way for the room to access this
            // view so that it may close itself, ect..
            this.activeRoom.view = this;
            
            var self = this;
            this.mainContent
                .html(self.activeRoom.el)
                .show();
            
            // Create the icons for this view, should be done 
            // on the room view, but the app needs to load it 
            // into view first before icons can be loaded.
            _.icon('view',   'add-favorite')
            _.icon('noview', 'remove-favorite')
            _.icon('cross',  'leave-room')
            _.icon('quote',  'message-submit');
            
            model[0].view && model[0].view.activate();
        },
        
        //###usersReady
        // Users collection has been subscribed to
        usersReady : function() {
            // Online user test
            this.server.onlineUsers(function(resp) {
                // Placeholder
            });
        },
        
        //###deactivateRoom
        // Remove user profile from DOM and view
        deactivateUser : function() {
            this.mainContent
                .fadeOut(50, function(){
                    $(this).html('');
                });
                
            this.activeUser && this.activeUser.remove();
        },
        
        //###activateUser
        // Show the user profile / main view
        activateUser : function(params) {
            this.deactivateUser();
            
            // Get model by ID
            var model = this.model.users.filter(function(user) {
                return user.get('username') === params
                    || user.get('_id') === params;
            });
            console.log('activateUser', model);
            if (!model || !model[0]) {
                this.router.invalid();
                return;
            }
            
            this.activeUser = new Views.UserMainView({
                model : model[0]
            });
            console.log('activateUser', this.activeUser);
            
            // Make view accessable to inner-view
            this.activeUser.view = this;
            
            var self = this;
            this.mainContent
                .html(self.activeUser.el)
                .show()
                .find('.avatar')
                .fadeIn(1500);
                
            // Create the icons for this view, should be done 
            // on the room view, but the app needs to load it 
            // into view first before icons can be loaded.
            _
                .icon('star',  'add-friend')
                .icon('star2', 'remove-friend')
                .icon('mail',  'send-message')
                .icon('cross', 'leave-profile')
                .icon('quote', 'post-submit');
        },
        
        //###showUsers
        // Show the sidebar user list
        showUsers : function() {
            this.roomList.fadeOut(150);
            this.userList.fadeIn(150);
        },
        
        //###allUsers
        // All rooms have been loaded into collection
        allUsers : function(users) {
            this.userList.html('');
            this.model.users.each(this.addUser);
            
            // Refresh model statistics
            this.statistics();
        },
        
        //###addUser
        // Add a single room room to the current veiw
        addUser : function(user) {
            var view = new Views.UserView({
                model : user
            }).render();
            
            this.userList
                .append(view.el);
            
            // Refresh model statistics
            this.statistics();
        }
    });
//})()