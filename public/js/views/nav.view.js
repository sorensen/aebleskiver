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
    Views.NavigationView = Backbone.View.extend({
    
        //###Templates
        // Predefined markdown templates for dynamic rendering
        loginTemplate        : _.template($('#login-template').html()),
        signupTemplate       : _.template($('#signup-template').html()),
        settingsTemplate     : _.template($('#settings-template').html()),
        createRoomTemplate   : _.template($('#create-room-template').html()),
        
        //##Interaction events
        // These are all interaction events between the 
        // user and this view's DOM interface
        events : {
            'keyup'              : 'hideOnEscape',
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
        },
        
        //##initialize
        // Setup the model and view interactions, unlike the 'events' 
        // property, the event bindings below are programmatic listeners
        // to model and collection changes
        initialize : function(options) {
            this.server = options.server;
        
            _.bindAll(this, 
                'render', 'toggleNav',
                'showCreateRoom', 'createRoom',
                'authenticate', 'register', 'logout'
            );
            this.model.navigation = this;
            this.render();
            
            // Set shortcuts to collection DOM
            this.loginDialog      = this.$('#login-dialog');
            this.signupDialog     = this.$('#signup-dialog');
            this.createRoomDialog = this.$('#create-room-dialog');
            this.settingsDialog   = this.$('#settings-dialog');
            this.overlay          = this.$('#overlay');
            
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
        },
        
        //###render
        // Render template contents onto the DOM, adding
        // any effects afterwards, such as icons
        render : function() {
            var options = {
                width  : 20,
                height : 20
            };
            
            // Create the icons for this view
            _.icon('home', 'home', options)
            _.icon('run', 'settings', options)
            
            return this;
        },
        
        //###hideOnEscape
        // Close modal keystroke listener
        hideOnEscape : function(e) {
            if (e.keyCode == 27) {
                this.hideDialogs();
            }
        },
        
        //###hideDialogs
        // Remove all defined dialoges from the view
        hideDialogs : function() {
            this.$('.dialog').hide();
            this.overlay.hide();
        },
        
        //###toggleNav
        // Alternate navigation based on user authentication
        toggleNav : function() {
            this.nav.signup.fadeOut(150);
            this.nav.login.fadeOut(150);
            this.nav.settings.fadeIn(150);
            this.nav.logout.fadeIn(150);
            this.nav.createRoom.fadeIn(150);
        },
        
        //###createRoom
        // Create new room room
        createRoom : function() {
            // User input
            var name        = this.$('input[name="room"]'),
                restricted  = this.$('input[name="restricted"]'),
                description = this.$('textarea[name="description"]');
            
            // Validation
            if (!name.val()) return;
            
            // Delegate to Backbone.sync
            this.model.createRoom({
                name        : name.val(),
                user_id     : user.get('id') || user.id,
                restricted  : restricted.val(),
                description : description.val()
            });
            
            // Should probably pass this in a success function
            this.createRoomDialog.fadeOut(150);
            this.overlay.hide();
            
            // Reset fields
            name.val('');
            restricted.val('');
            description.val('');
        },
        
        //###createRoomOnEnter
        // Create room keystroke listener
        createRoomOnEnter : function(e) {
            if (e.keyCode == 13) this.createRoom();
        },
        
        //###showCreateRoom
        // Show the login form
        showCreateRoom : function() {
            var self = this;
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.createRoomDialog
                .html(Mustache.to_html(this.createRoomTemplate()))
                .fadeIn(150, function(){
                
                    // Apply happy validation schema, this might be 
                    // better placed and only accessed here, as the 
                    // DOM elements must exist before they can be happy
                    self.$('#create-room-form').isHappy({
                        fields : {
                            '#create-room-name' : {
                                required : true,
                                message  : 'Please name this room'
                            },
                            '#create-room-description' : {
                                required : true,
                                message  : 'Give some info about this room'
                            }
                        },
                        submitButton : '#create-room-submit',
                        unHappy : function() {
                            alert('Create room is unhappy. :(');
                        }
                    });
                })
                .draggable()
                .find('input[name="room"]').focus();
        },
        
        //###showSettings
        // Show the login form
        showSettings : function() {
            var self = this;
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.settingsDialog
                .html(Mustache.to_html(this.settingsTemplate(), user.toJSON()))
                .fadeIn(150, function() {
                
                    // Apply happy validation schema, this might be 
                    // better placed and only accessed here, as the 
                    // DOM elements must exist before they can be happy
                    self.$('#settings-form').isHappy({
                        fields : {
                            '#settings-username' : {
                                required : true,
                                message  : 'What should we call you?'
                            },
                            '#settings-email' : {
                                required : true,
                                message  : 'Email is required',
                                test     : happy.email
                            }
                        },
                        submitButton : '#settings-submit',
                        unHappy : function() {
                            alert('Settings are unhappy. :(');
                        }
                    });
                })
                .draggable()
                .find('input[name="displayname"]').focus();
        },
        
        //###saveSettings
        // Save updated user settings
        saveSettings : function() {
            var self = this;
                data = {
                    bio         : this.$('textarea[name="bio"]').val(),
                    email       : this.$('input[name="email"]').val(),
                    password    : this.$('input[name="password"]').val(),
                    displayName : this.$('input[name="displayname"]').val()
                };
            
            user.save(data, {
                channel  : 'app:users',
                finished : function(resp) {
                }
            });
            this.settingsDialog.fadeOut(150);
            this.overlay.hide();
        },
        
        //###saveSettingsOnEnter
        // Create room keystroke listener
        saveSettingsOnEnter: function(e) {
            if (e.keyCode == 13) this.saveSettings();
        },
        
        //###showLogin
        // Show the login form
        showLogin : function() {
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.loginDialog
                .html(Mustache.to_html(this.loginTemplate()))
                .fadeIn(150, function(){
                
                    // Apply happy validation schema, this might be 
                    // better placed and only accessed here, as the 
                    // DOM elements must exist before they can be happy
                    self.$('#login-form').isHappy({
                        fields : {
                            '#login-username' : {
                                required : true,
                                message  : 'Who are you again?'
                            },
                            '#login-password' : {
                                required : true,
                                message  : 'Password please'
                            }
                        },
                        submitButton : '#login-submit',
                        unHappy : function() {
                            alert('Login is unhappy. :(');
                        }
                    });
                })
                .draggable()
                .find('input[name="username"]').focus();
        },
        
        //###authenticate
        // Authenticate the current user, check the credentials
        // sent on the Server side, which will return the client 
        // data to update the default model with
        authenticate : function() {
            var self = this,
                data = {
                    username : this.$('input[name="username"]').val(),
                    password : this.$('input[name="password"]').val()
                },
                options = {
                    token : this.sid,
                    error : function(code, data, options) {
                    },
                };
            
            user.authenticate(data, options, function(resp) {
                self.toggleNav();
            });
            this.loginDialog.hide();
            this.overlay.hide();
        },
        
        //###authenticateOnEnter
        // Authentication keystroke listener
        authenticateOnEnter: function(e) {
            if (e.keyCode == 13) this.authenticate();
        },
        
        //###showSignup
        // Show the login form
        showSignup : function() {
            var self = this;
            this.hideDialogs();
            this.overlay.fadeIn(150);
            this.signupDialog
                .html(Mustache.to_html(this.signupTemplate()))
                .fadeIn(150, function(){
                
                    // Apply happy validation schema, this might be 
                    // better placed and only accessed here, as the 
                    // DOM elements must exist before they can be happy
                    self.$('#signup-form').isHappy({
                        fields : {
                            '#signup-username' : {
                                required : true,
                                message  : 'What should we call you?'
                            },
                            '#signup-email' : {
                                required : true,
                                message  : 'We need a way to reach you',
                                test     : happy.email
                            },
                            '#signup-password' : {
                                required : true,
                                message  : 'Password required',
                                test     : happy.minLength(7)
                            }
                        },
                        submitButton : '#signup-submit',
                        unHappy : function() {
                            alert('Signup is unhappy. :(');
                        }
                    });
                })
                .draggable()
                .find('input[name="username"]').focus();
        },
        
        //###register
        // Authenticate the current user, check the credentials
        // sent on the Server side, which will return the client 
        // data to update the default model with
        register : function() {
            var self = this,
                data = {
                    username    : this.$('input[name="username"]').val(),
                    displayName : this.$('input[name="displayname"]').val(),
                    email       : this.$('input[name="email"]').val(),
                    password    : this.$('input[name="password"]').val(),
                },
                options = {
                    token : this.sid,
                    error : function(code, data, options) {
                    }
                };
            
            user.register(data, options, function(resp) {
                self.toggleNav();
            });
            this.signupDialog.hide();
            this.overlay.hide();
        },
        
        //###registerOnEnter
        // Registration keystroke listener
        registerOnEnter: function(e) {
            if (e.keyCode == 13) this.register();
        },
        
        //###logout
        // Destroy the current user object and restore original
        // navigation display
        logout : function() {
            user.logout({
                token : this.sid
            });
            
            this.friendList.html('');
            this.favoriteList.html('');
            user = new Models.UserModel();
            
            this.conversationList.html('');
            root.user.conversations = new Models.ConversationCollection();
            
            this.nav.signup.fadeIn(150);
            this.nav.login.fadeIn(150);
            this.nav.settings.fadeOut(150);
            this.nav.logout.fadeOut(150);
        }
    });
//})()