(function(Views) {
    // Application view
    // -----------------
    
    // Application
    Views.ApplicationView = Backbone.View.extend({
    
        // DOM attributes
        template            : _.template($('#application-template').html()),
        statsTemplate       : _.template($('#application-stats-template').html()),
        loginTemplate       : _.template($('#login-template').html()),
        signupTemplate      : _.template($('#signup-template').html()),
        settingsTemplate    : _.template($('#settings-template').html()),
        createRoomTemplate  : _.template($('#create-room-template').html()),
        
        // Interaction events
        events    : {
            "click #show-rooms"  : "showRooms",
            "click #show-users"  : "showUsers",
            "click .cancel"      : "hideDialogs",
            "click #logout"      : "logout",
            
            // Create new room form
            "click #create-room"              : "showCreateRoom",
            "click #create-room-form .submit" : "createRoom",
            "keypress #create-room-form input": "createRoomOnEnter",
            
            // Login form
            "click #login"                    : "showLogin",
            "click #login-form .submit"       : "authenticate",
            "keypress #login-form input"      : "authenticateOnEnter",
            
            // Settings form
            "click #settings"                 : "showSettings",
            "click #settings-form .submit"    : "saveSettings",
            "keypress #settings-form input"   : "saveSettingsOnEnter",
      
            // Registration form
            "click #signup"                   : "showSignup",
            "click #signup-form .submit"      : "register",
            "keypress #signup-form input"     : "registerOnEnter",
        },
        
        // Constructor
        initialize : function(options) {
            _.bindAll(this, 
                'render', 'addRoom', 'createRoom', 'addUser',
                'authenticate', 'register', 'allRooms'
            );    
            this.render = _.bind(this.render, this);

            // Set the application model directly, since there is a 
            // one to one relationship between the view and model
            this.model = new Models.ApplicationModel({
            
                // This can be used to represent different
                // servers, or instances of the program, since
                // it is the base ID of every model url path
                id : 's1'
            });
            
            this.model.bind('change', this.render);
            this.model.users.bind('add', this.addUser);
            this.model.users.bind('change', this.render);
            this.model.rooms.bind('add', this.addRoom);
            this.model.rooms.bind('change', this.render);
            this.model.rooms.bind('subscribe', this.ready);
            this.model.rooms.bind('refresh', this.allRooms);
            
            // Render template contents
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            this.el.html(view);
            
            // Set shortcuts to collection DOM
            this.userList         = this.$('#users');
            this.roomList         = this.$('#rooms');
            this.mainContent      = this.$('#main-content');
            this.loginDialog      = this.$('#login-dialog');
            this.signupDialog     = this.$('#signup-dialog');
            this.createRoomDialog = this.$('#create-room-dialog');
            this.settingsDialog   = this.$('#settings-dialog');
            this.overlay          = this.$('#overlay');
            
            this.render();
        },
        
        // Refresh statistics
        render : function() {
            console.log('app render', this);
            var totalUsers = this.model.users.length;
            var totalRooms = this.model.get('rooms').length;
            
            var totalMessages = 0;
            this.model.rooms.each(function(room){
                totalMessages += room.get('messages').length;
            });
            
            this.$('#app-stats').html(Mustache.to_html(this.statsTemplate(), {
                totalUsers    : totalUsers,
                totalRooms    : totalRooms,
                totalMessages : totalMessages,
                version       : $('#version').html()
            }));
            return this;
        },
        
        // The model has been subscribed to, and is now
        // synchronized with the server
        ready : function() {
        
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
        
        // All rooms have been loaded into collection
        allRooms : function() {
            // Start history once we have model data
            Backbone.history.start();
            
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
                .fadeOut(0, function(){
                    $(this).html('');
                });
            
            // Join Channel
            this.activeRoom && this.activeRoom.remove();
        },
        
        activateRoom : function(params) {
            this.deactivateRoom();
            
            // Get model by ID
            var model = this.model.rooms.get(params);
            if (!model) return;
            
            this.activeRoom = new Views.RoomMainView({
                model : model
            }).render();
            
            var self = this;
            this.mainContent
                .fadeIn(0, function(){
                    $(this).html(self.activeRoom.el);
                    self.activeRoom.messagelist.scrollTop(
                    
                        // Scroll to the bottom of the message window
                        self.activeRoom.messagelist[0].scrollHeight
                    );
                    delete self;
                });
                
            this.$('input[name="message"]').focus();
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
        createRoomOnEnter: function(e) {
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
                });
                
            this.$('#login input[name="username"]').focus();
        },
        
        // Authenticate the current user, check the credentials
        // sent on the server side, which will return the client 
        // data to update the default model with
        authenticate : function() {
            var options = {
                username    : this.$('input[name="username"]').val(),
            };
            var model = window.user.toJSON();
            
            // Add user info to the model before sending
            _.extend(model, options);
            
            var params = _.extend(options, {
                token       : $('#token').html(),
                password    : this.$('input[name="password"]').val(),
                error       : function(code, data, options) {
                    console.log('Auth error: code: ', code);
                    console.log('Auth error: data: ', data);
                    console.log('Auth error: options: ', options);
                    
                    console.log('before switch');
                    switch(code) {
                        case 400 : alert('Bad parameters'); break;
                        case 401 : alert('Wrong password'); break;
                        case 404 : alert('User not found'); break;
                    }
                },
            });
            
            var self = this;
            Server.authenticate(model, params, function(resp) {
                // Update the current model with the returned data, 
                // increase total visits, and chage the status to 'online'
                window.user.set(resp);
                window.user.set({
                    visits : window.user.get('visits') + 1,
                    status : 'online',
                });
                
                // Request a gravatar image for the current 
                // user based on email address
                var params = {
                    email : window.user.get('email'),
                    size  : 40
                };
                
                Server.gravatar(params, function(resp) {
                    window.user.save({ avatar : resp });
                });
                
                alert('Sign in successfull');
                self.toggleNav();
                delete self;
                
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
            var options = {
                username    : this.$('input[name="username"]').val(),
                displayName : this.$('input[name="displayname"]').val(),
                email       : this.$('input[name="email"]').val(),
            };
            var model = window.user.toJSON();
            
            // Add user info to the model before sending
            _.extend(model, options);
            
            var params = _.extend(options, {
                token       : $('#token').html(),
                password    : this.$('input[name="password"]').val(),
                error       : function(code, data, options) {
                    console.log('Auth error: code: ', code);
                    console.log('Auth error: data: ', data);
                    console.log('Auth error: options: ', options);
                    
                    console.log('before switch');
                    switch(code) {
                        case 400 : alert('Bad parameters'); break;
                        case 401 : alert('Username taken'); break;
                    }
                },
            });
            var self = this;
            Server.register(model, params, function(resp) {
                // Update the current model with the returned data, 
                // increase total visits, and chage the status to 'online'
                window.user.set(resp);
                window.user.set({
                    visits : window.user.get('visits') + 1,
                    status : 'online',
                });
                
                // Request a gravatar image for the current 
                // user based on email address
                var params = {
                    email : window.user.get('email'),
                    size  : 40
                };
                
                Server.gravatar(params, function(resp) {
                    window.user.set({ avatar : resp });
                });
                
                alert('Registration complete');
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
            delete window.user;
            window.user = new Models.UserModel();
            
            this.$('#signup').fadeIn(150);
            this.$('#login').fadeIn(150);
            
            this.$('#settings').fadeOut(150);
            this.$('#logout').fadeOut(150);
            this.$('#create-room').fadeOut(150);
        },
        
    });
})(Views)