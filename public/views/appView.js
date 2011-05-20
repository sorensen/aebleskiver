(function(Views) {
    // Application view
    // -----------------
    
    // Application
    Views.ApplicationView = Backbone.View.extend({
    
        // DOM attributes
        template             : _.template($('#application-template').html()),
        statsTemplate        : _.template($('#application-stats-template').html()),
        loginTemplate        : _.template($('#login-template').html()),
        signupTemplate       : _.template($('#signup-template').html()),
        settingsTemplate     : _.template($('#settings-template').html()),
        createRoomTemplate   : _.template($('#create-room-template').html()),
        notificationTemplate : _.template($('#notification-template').html()),
        
        // Interaction events
        events    : {
            'click #show-rooms'  : 'showRooms',
            'click #show-users'  : 'showUsers',
            'click .cancel'      : 'hideDialogs',
            'click #overlay'     : 'hideDialogs',
            'click #logout'      : 'logout',
            
            // Create new room form
            'click #create-room'               : 'showCreateRoom',
            'click #create-room-form .submit'  : 'createRoom',
            'keypress #create-room-form input' : 'createRoomOnEnter',
            
            // Login form
            'click #login'               : 'showLogin',
            'click #login-form .submit'  : 'authenticate',
            'keypress #login-form input' : 'authenticateOnEnter',
            
            // Settings form
            'click #settings'               : 'showSettings',
            'click #settings-form .submit'  : 'saveSettings',
            'keypress #settings-form input' : 'saveSettingsOnEnter',
            
            // Registration form
            'click #signup'               : 'showSignup',
            'click #signup-form .submit'  : 'register',
            'keypress #signup-form input' : 'registerOnEnter',
            
            // Search form
            'keypress #search' : 'searchOnEnter',
            
            // Webcam events
            'click #open-webcam' : 'loadWebcam',
            
            // Friends
            'click #friend-list .title'   : 'toggleFriendList',
            'click #favorite-list .title' : 'toggleFavoriteList',
            'click #start-menu .title'    : 'toggleSidebar'
        },
        
        // Constructor
        initialize : function(options) {
            _.bindAll(this, 
                'render', 'toggleNav',
                'addRoom', 'showCreateRoom', 'createRoom', 'allRooms', 'roomsReady',
                'addUser', 'allUsers', 'usersReady', 'authenticate', 'register', 'logout',
                'loadWebcam', 'toggleSidebar',
                'toggleFriendList', 'allFriends', 'addFriend',
                'toggleFavoriteList', 'allFavorites', 'addFavorite'
            );

            // Set the application model directly, since there is a 
            // one to one relationship between the view and model
            this.model = new Models.ApplicationModel({
            
                // This can be used to represent different
                // servers, or instances of the program, since
                // it is the base ID of every model url path
                server : 's1'
            });
            this.model.view = this;
            
            // Application model event bindings
            this.model.bind('change', this.render);
            this.model.bind('subscribe', this.ready);
            
            // User collection event bindings
            this.model.users.bind('subscribe', this.usersReady);
            this.model.users.bind('add', this.addUser);
            this.model.users.bind('add', this.render);
            this.model.users.bind('change', this.render);
            this.model.users.bind('refresh', this.allUsers);
            this.model.users.bind('refresh', this.render);
            
            // Room collection event bindings
            this.model.rooms.bind('subscribe', this.roomsReady);
            this.model.rooms.bind('add', this.addRoom);
            this.model.rooms.bind('add', this.render);
            this.model.rooms.bind('change', this.render);
            this.model.rooms.bind('refresh', this.allRooms);
            this.model.rooms.bind('refresh', this.render);
            
            // Render template contents
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);
            this.el.html(view);
            
            // Assign pre-pouplated locals from Express
            this.sid              = token;
            this.port             = port;
            this.version          = version;
            
            // Set shortcuts to collection DOM
            this.searchInput      = this.$('#search');
            this.userList         = this.$('#users');
            this.roomList         = this.$('#rooms');
            this.sidebar          = this.$('#sidebar');
            this.mainContent      = this.$('#main-content');
            this.loginDialog      = this.$('#login-dialog');
            this.signupDialog     = this.$('#signup-dialog');
            this.createRoomDialog = this.$('#create-room-dialog');
            this.settingsDialog   = this.$('#settings-dialog');
            this.overlay          = this.$('#overlay');
            this.roomName         = this.$('input[name="room"]');
            this.friends          = this.$('#friend-list');
            this.friendList       = this.$('.friends');
            this.favorites        = this.$('#favorite-list');
            this.favoriteList     = this.$('.favorites');
            
            // Navigation items for authentication toggling
            this.nav = {
                signup     : this.$('#signup'),
                login      : this.$('#login'),
                logout     : this.$('#logout'),
                settings   : this.$('#settings'),
                createRoom : this.$('#create-room')
            };
            this.nav.settings.hide();
            this.nav.logout.hide();
            
            var self = this;
            // Create a new user for the current client, only the 
            // defaults will be used until the client authenticates
            // with valid credentials
            window.user = new Models.UserModel();
            window.user.subscribe({}, function(resp) {
            
                // Current user bindings
                window.user.friends.bind('add', self.addFriend);
                window.user.friends.bind('refresh', self.allFriends);
                
                window.user.favorites.bind('add', self.addFavorite);
                window.user.favorites.bind('refresh', self.allFavorites);
            });
            
            // Internal sidebar settings, pull settings
            // from the cookie and bootstrap if required
            this.minimal = $.cookie('minimal') || 'false';
            
            if (this.minimal === 'true') {
                $(this.el).addClass('minimal');
            }
        },
        
        toggleSidebar : function() {
            if (this.minimal == 'true') {
                this.minimal = 'false';
                $(this.el).removeClass('minimal');
            } 
            else {
                this.minimal = 'true';
                $(this.el).addClass('minimal');
            }
            $.cookie('minimal', this.minimal);
        },
        
        toggleFriendList : function() {
            this.friends.toggleClass('open');
        },
        
        // All rooms have been loaded into collection
        allFriends : function(friends) {
            this.friendList.html('');
            window.user.friends.each(this.addFriend);
            
            // Refresh model statistics
            this.render();
        },
        
        // Add a single room room to the current veiw
        addFriend : function(friend) {
            var view = new Views.UserView({
                model : friend
            }).render();
            
            this.friendList
                .append(view.el);
        },
        
        toggleFavoriteList : function() {
            this.favorites.toggleClass('open');
        },
        
        // All rooms have been loaded into collection
        allFavorites : function(favorites) {
            this.favoriteList.html('');
            window.user.favorites.each(this.addFavorite);
            
            // Refresh model statistics
            this.render();
        },
        
        // Add a single room room to the current veiw
        addFavorite : function(favorite) {
            var view = new Views.RoomView({
                model : favorite
            }).render();
            
            this.favoriteList
                .append(view.el);
        },
        
        loadWebcam : function() {
            this.webcam = new Views.WebcamView();
            this.el.append(this.webcam.render().el);
            this.webcam.start();
        },
        
        // Refresh statistics
        render : function() {
            var totalUsers = this.model.users.length || 0;
            var totalRooms = this.model.rooms.length || 0;
            
            this.$('#app-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalUsers : totalUsers,
                totalRooms : totalRooms,
                version    : this.version
            }));
            return this;
        },
        
        // The model has been subscribed to, and is now
        // synchronized with the server
        ready : function() {
        
        },
        
        // Create room keystroke listener, throttled function
        // returned to reduce load on the server
        searchOnEnter : _.throttle(function() {
            var self = this;
            var input = this.searchInput.val();
            var query = (input.length < 1) ? {} : {
                keywords : { $in : [ input ] }
            };
            
            this.model.rooms.fetch({
                query : query,
                error : function(code, msg, opt) {
                },
                finished : function(resp) {
                }
            });
            
        }, 500),
        
        // Create room keystroke listener, throttled function
        // returned to reduce load on the server
        searchOnTab : function(e) {
            if (e.keyCode === $.ui.keyCode.TAB && $(this).data('autocomplete').menu.active) {
                event.preventDefault();
            }
        },
        
        // Alternate navigation based on user authentication
        toggleNav : function() {
            this.nav.signup.fadeOut(150);
            this.nav.login.fadeOut(150);
            this.nav.settings.fadeIn(150);
            this.nav.logout.fadeIn(150);
            this.nav.createRoom.fadeIn(150);
        },
        
        // Remove all defined dialoges from the view
        hideDialogs : function() {
            this.loginDialog.hide();
            this.signupDialog.hide();
            this.createRoomDialog.hide();
            this.settingsDialog.hide();
            this.overlay.hide();
        },
        
        // Room collection has been subscribed to
        roomsReady : function() {
        
        },
        
        // All rooms have been loaded into collection
        allRooms : function(rooms) {
            this.roomList.html('');
            this.model.rooms.each(this.addRoom);
            
            // Refresh model statistics
            this.render();
        },
        
        // Show the sidebar user list
        showRooms : function() {
            this.userList.fadeOut(150);
            this.roomList.fadeIn(150);
        },
        
        // Add a single room room to the current veiw
        addRoom : function(room) {
            var view = new Views.RoomView({
                model : room
            }).render();
            
            this.roomList
                .append(view.el);
        },
        
        deactivateRoom : function() {
            this.mainContent
                .fadeOut(50, function(){
                    $(this).html('');
                });
            
            // Join Channel
            this.activeRoom && this.activeRoom.remove();
        },
        
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
            }).render();
            
            var self = this;
            this.mainContent
                .fadeIn(75, function(){
                    $(this).html(self.activeRoom.el);
                    self.activeRoom.messageList.scrollTop(
                    
                        // Scroll to the bottom of the message window
                        self.activeRoom.messageList[0].scrollHeight
                    );
                    delete self;
                })
                .find('input[name="message"]').focus();
        },
        
        // Create new room room
        createRoom : function() {
            // User input
            var name        = this.$('input[name="room"]'),
                //tags        = this.$('input[name="tags"]'),
                //image       = this.$('input[name="image"]'),
                //restricted  = this.$('input[name="restricted"]'),
                description = this.$('textarea[name="description"]');
            
            // Validation
            if (!name.val()) return;
            
            // Delegate to Backbone.sync
            this.model.createRoom({
                name        : name.val(),
                //tags        : tags.val(),
                user_id     : window.user.get('id') || window.user.id,
                //restricted  : restricted.val(),
                description : description.val()
            });
            
            // Should probably pass this in a success function
            this.createRoomDialog.fadeOut(150);
            this.overlay.hide();
            
            // Reset fields
            name.val('');
            //tags.val('');
            //image.val('');
            //restricted.val('');
            description.val('');
        },
        
        // Create room keystroke listener
        createRoomOnEnter : function(e) {
            if (e.keyCode == 13) this.createRoom();
        },
        
        // Show the login form
        showCreateRoom : function() {
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.createRoomDialog
                .html(Mustache.to_html(this.createRoomTemplate()))
                .fadeIn(150, function(){
                })
                .find('input[name="room"]').focus();
        },
        
        // Users collection has been subscribed to
        usersReady : function() {
            // Online user test
            Server.onlineUsers(function(resp) {
            });
        },
        
        // Remove user profile from DOM
        deactivateUser : function() {
            this.mainContent
                .fadeOut(50, function(){
                    $(this).html('');
                });
                
            this.activeUser && this.activeUser.remove();
        },
        
        // Show the user profile / main view
        activateUser : function(params) {
            this.deactivateUser();
            
            // Get model by ID
            var model = this.model.users.filter(function(room) {
                return room.get('username') === params
                    || room.get('id') === params;
            });
            if (!model) {
                Backbone.history.saveLocation('/');
                return;
            }
            
            this.activeUser = new Views.UserMainView({
                model : model[0]
            }).render();
            
            var self = this;
            this.mainContent
                .fadeIn(75, function(){
                    $(this)
                        .html(self.activeUser.el)
                        .find('.avatar')
                        .fadeIn(1500);
                })
        },
        
        // Show the login form
        showSettings : function() {
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.settingsDialog
                .html(Mustache.to_html(this.settingsTemplate(), window.user.toJSON()))
                .fadeIn(150, function(){
                })
                .find('input[name="displayname"]').focus();
        },
        
        // Save updated user settings
        saveSettings : function() {
            var data = {
                bio         : this.$('textarea[name="bio"]').val(),
                email       : this.$('input[name="email"]').val(),
                password    : this.$('input[name="password"]').val(),
                displayName : this.$('input[name="displayname"]').val()
            };
            var self = this;
            window.user.save(data, {
                channel  : 'app:users',
                finished : function(resp) {
                }
            });
            this.settingsDialog.fadeOut(150);
            this.overlay.hide();
        },
        
        // Create room keystroke listener
        saveSettingsOnEnter: function(e) {
            if (e.keyCode == 13) this.saveSettings();
        },
        
        // Show the sidebar user list
        showUsers : function() {
            this.roomList.fadeOut(150);
            this.userList.fadeIn(150);
        },
        
        // All rooms have been loaded into collection
        allUsers : function(users) {
            this.userList.html('');
            this.model.users.each(this.addUser);
            
            // Refresh model statistics
            this.render();
        },
        
        // Add a single room room to the current veiw
        addUser : function(user) {
            var view = new Views.UserView({
                model : user
            }).render();
            
            this.userList
                .append(view.el);
        },
        
        // Show the login form
        showLogin : function() {
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.loginDialog
                .html(Mustache.to_html(this.loginTemplate()))
                .fadeIn(150, function(){
                    
                })
                .find('input[name="username"]').focus();
        },
        
        // Authenticate the current user, check the credentials
        // sent on the server side, which will return the client 
        // data to update the default model with
        authenticate : function() {
            var data = {
                username : this.$('input[name="username"]').val(),
                password : this.$('input[name="password"]').val()
            };
            
            var options = {
                token : this.sid,
                error : function(code, data, options) {
                },
            };
            
            var self = this;
            window.user.authenticate(data, options, function(resp) {
                self.toggleNav();
            });
            this.loginDialog.hide();
            this.overlay.hide();
        },
        
        // Authentication keystroke listener
        authenticateOnEnter: function(e) {
            if (e.keyCode == 13) this.authenticate();
        },
        
        // Show the login form
        showSignup : function() {
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.signupDialog
                .html(Mustache.to_html(this.signupTemplate()))
                .fadeIn(150, function(){
                })
                .find('input[name="username"]').focus();
        },
        
        // Authenticate the current user, check the credentials
        // sent on the server side, which will return the client 
        // data to update the default model with
        register : function() {
            var data = {
                username    : this.$('input[name="username"]').val(),
                displayName : this.$('input[name="displayname"]').val(),
                email       : this.$('input[name="email"]').val(),
                password    : this.$('input[name="password"]').val(),
            };
            var options = {
                token : this.sid,
                error : function(code, data, options) {
                }
            };
            
            var self = this;
            window.user.register(data, options, function(resp) {
                self.toggleNav();
            });
            this.signupDialog.hide();
            this.overlay.hide();
        },
        
        // Registration keystroke listener
        registerOnEnter: function(e) {
            if (e.keyCode == 13) this.register();
        },
        
        // Destroy the current user object and restore original
        // navigation display
        logout : function() {
            window.user.logout({
                token : this.sid
            });
            
            this.friendList.html('');
            this.favoriteList.html('');
            window.user = new Models.UserModel();
            
            this.nav.signup.fadeIn(150);
            this.nav.login.fadeIn(150);
            this.nav.settings.fadeOut(150);
            this.nav.logout.fadeOut(150);
            this.nav.createRoom.fadeOut(150);
        },
        
    });
})(Views)