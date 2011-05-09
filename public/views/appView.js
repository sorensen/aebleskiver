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
            "click #show-rooms"  : "showRooms",
            "click #show-users"  : "showUsers",
            "click .cancel"      : "hideDialogs",
            "click #logout"      : "logout",
            
            // Create new room form
            "click #create-room"               : "showCreateRoom",
            "click #create-room-form .submit"  : "createRoom",
            "keypress #create-room-form input" : "createRoomOnEnter",
            
            // Login form
            "click #login"               : "showLogin",
            "click #login-form .submit"  : "authenticate",
            "keypress #login-form input" : "authenticateOnEnter",
            
            // Settings form
            "click #settings"               : "showSettings",
            "click #settings-form .submit"  : "saveSettings",
            "keypress #settings-form input" : "saveSettingsOnEnter",
            
            // Registration form
            "click #signup"               : "showSignup",
            "click #signup-form .submit"  : "register",
            "keypress #signup-form input" : "registerOnEnter",
            
            // Search form
            "keypress #search" : "searchOnEnter"
        },
        
        // Constructor
        initialize : function(options) {
            _.bindAll(this, 
                'render', 
                'addRoom', 'createRoom', 'allRooms', 'roomsReady',
                'addUser', 'register', 'allUsers', 'usersReady', 
                'authenticate'
            );

            // Set the application model directly, since there is a 
            // one to one relationship between the view and model
            this.model = new Models.ApplicationModel({
            
                // This can be used to represent different
                // servers, or instances of the program, since
                // it is the base ID of every model url path
                server : 's1'
            });
            
            // Application model event bindings
            this.model.bind('change', this.render);
            this.model.bind('subscribe', this.ready);
            
            // User collection event bindings
            this.model.users.bind('subscribed', this.usersReady);
            this.model.users.bind('add', this.addUser);
            //this.model.users.bind('add', this.render);
            //this.model.users.bind('change', this.render);
            this.model.users.bind('refresh', this.allUsers);
            //this.model.users.bind('refresh', this.render);
            
            // Room collection event bindings
            this.model.rooms.bind('subscribed', this.roomsReady);
            this.model.rooms.bind('add', this.addRoom);
            //this.model.rooms.bind('add', this.render);
            //this.model.rooms.bind('change', this.render);
            this.model.rooms.bind('refresh', this.allRooms);
            //this.model.rooms.bind('refresh', this.render);
            
            // Render template contents
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(), content);            
            this.el.html(view);
            
            // Set shortcuts to collection DOM
            this.sid              = $('#token').html();
            this.searchInput      = this.$('#search');
            this.userList         = this.$('#users');
            this.roomList         = this.$('#rooms');
            this.mainContent      = this.$('#main-content');
            this.loginDialog      = this.$('#login-dialog');
            this.signupDialog     = this.$('#signup-dialog');
            this.createRoomDialog = this.$('#create-room-dialog');
            this.settingsDialog   = this.$('#settings-dialog');
            this.overlay          = this.$('#overlay');
            this.roomName         = this.$('input[name="room"]');
            this.roomTags         = this.$('#tags');
            
            //this.$('#signup').hide();
            //this.$('#login').hide();
            this.$('#settings').hide();
            this.$('#logout').hide();
            //this.$('#show-users').hide();
            //this.$('#show-rooms').hide();
            
            // Create a new user for the current client, only the 
            // defaults will be used until the client authenticates
            // with valid credentials
            window.user = new Models.UserModel();
            
            // Available room tags
            this.tags = [
                'general',
                'random',
                'technology'
            ];
            
            var self = this;
            
            // Common autocomplete procedures
            this.auto = {
                minLength: 0,
                source: function(request, response) {
                
                    // delegate back to autocomplete, but extract the last term
                    response( $.ui.autocomplete.filter(
                        self.tags, Helpers.extractLast( request.term ) ) );
                },
                focus: function() {
                    // prevent value inserted on focus
                    return false;
                },
                select: function(event, ui) {
                    console.log('autocomp select', ui);
                    var terms = Helpers.split( this.value );
                    
                    // remove the current input
                    terms.pop();
                    
                    // add the selected item
                    terms.push( ui.item.value );
                    
                    // add placeholder to get the comma-and-space at the end
                    terms.push("");
                    this.value = terms.join(", ");
                    return false;
                }
            };

            // Register autocomplete inputs
            this.searchInput.autocomplete(self.auto);
        },
        
        // Refresh statistics
        render : function() {
            console.log('app render', this);
            var totalUsers = this.model.users.length || 0;
            var totalRooms = this.model.rooms.length || 0;
            
            this.$('#app-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalUsers : totalUsers,
                totalRooms : totalRooms,
                version    : $('#version').html()
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
        
            //TODO: Finish functionality out
            
            var self = this;
            var input = this.searchInput.val();
            
            this.model.rooms.fetch({
                query : {
                    tags : { $in : [ input ] }
                },
                error : function(code, msg, opt) {
                    console.log('search error', code); 
                    console.log('search error', msg); 
                    console.log('search error', opt); 
                },
                finished : function(resp) {
                    console.log('rooms searched', resp);
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
            this.$('#signup').fadeOut(150);
            this.$('#login').fadeOut(150);
            this.$('#settings').fadeIn(150);
            this.$('#logout').fadeIn(150);
            this.$('#create-room').fadeIn(150);
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
            console.log('allRooms', rooms);
            
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
            console.log('activateRoom: ', params);
            this.deactivateRoom();
            
            // Get model by ID
            var model = this.model.rooms.filter(function(room) {
                return room.get('slug') === params;
            });
            if (!model) return;
            
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
                });
                
            this.activeRoom.$('input[name="message"]').focus();
        },
        
        // Create new room room
        createRoom : function() {
            var name = this.$('input[name="room"]');
            if (!name.val()) return;
            this.model.createRoom({
                name : name.val(),
            });
            this.createRoomDialog.fadeOut(150);
            this.overlay.hide();
            name.val('');
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
                });
                
            this.$('input[name="room"]').focus();
            this.roomTags.autocomplete(self.auto);
        },
        
        // Users collection has been subscribed to
        usersReady : function() {
            console.log('usersReady: ', window.user);
            
            var params = {
                token : this.sid,
                error : function(code, data, options) {
                
                    console.log('get user error: code: ', code);
                    console.log('get user error: data: ', data);
                    console.log('get user error: options: ', options);
                    
                    switch(code) {
                        case 400 : console.log('Bad parameters'); break;
                        case 500 : console.log('Internal server error'); break;
                    }
                },
            };
            console.log('how....');
            var self = this;
            Server.getSession(window.user.toJSON(), params, function(session, options) {
                if (!session) return;
                window.user.set(session);
                // Request a gravatar image for the current 
                // user based on email address
                var params = {
                    email : window.user.get('email'),
                    size  : 40
                };
                Server.gravatar(params, function(resp) {
                    window.user.set({ avatar : resp });
                });
                console.log('Got Session: ', session);
                session._id && self.toggleNav();
                console.log('session.user: ', window.user);
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
            console.log('activeUser: ', params);
            this.deactivateUser();
            
            // Get model by ID
            var model = this.model.users.filter(function(room) {
                return room.get('username') === params;
            });
            if (!model) return;
            
            this.activeUser = new Views.UserMainView({
                model : model[0]
            }).render();
            
            var self = this;
            this.mainContent
                .fadeIn(75, function(){
                    $(this).html(self.activeUser.el);
                });
        },
        
        // Show the login form
        showSettings : function() {
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.settingsDialog
                .html(Mustache.to_html(this.settingsTemplate()))
                .fadeIn(150, function(){
                });
                
            this.$('input[name="displayname"]').focus();
        },
        
        // Save updated user settings
        saveSettings : function() {
            var options = {
                displayName : this.$('input[name="displayname"]').val(),
                email       : this.$('input[name="email"]').val(),
            };
            var model = window.user.toJSON();
            
            //TODO: Save settings on server securely
            
            this.saveSettingsDialog.fadeOut(150);
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
            console.log('allUsers', users);
            
            this.userList.html('');
            this.model.users.each(this.addUser);
            
            // Refresh model statistics
            this.render();
        },
        
        // Add a single room room to the current veiw
        addUser : function(user) {
            console.log('add user', user);
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
                });
                
            this.$('#login input[name="username"]').focus();
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
                    console.log('Auth error: code: ', code);
                    console.log('Auth error: data: ', data);
                    console.log('Auth error: options: ', options);
                },
            };
            
            var self = this;
            window.user.authenticate(data, options, function(resp) {
                console.log('app authenticated: ', resp);
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
                });
                
            this.$('#register input[name="username"]').focus();
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
                token : $('#token').html(),
                error : function(code, data, options) {
                    console.log('register error: code: ', code);
                    console.log('register error: data: ', data);
                    console.log('register error: options: ', options);
                }
            };
            console.log('register', options);
            
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
            var options = {
                token : this.sid
            };
            Server.logout(window.user.toJSON(), options);
            window.user = new Models.UserModel();
            
            this.$('#signup').fadeIn(150);
            this.$('#login').fadeIn(150);
            
            this.$('#settings').fadeOut(150);
            this.$('#logout').fadeOut(150);
            this.$('#create-room').fadeOut(150);
        },
        
    });
})(Views)