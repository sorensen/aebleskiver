//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // Sidebar view
    // ------------
    
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
    
        //###templates
        // Predefined markdown templates for dynamic rendering
        template      : _.template($('#sidebar-template').html()),
        statsTemplate : _.template($('#application-stats-template').html()),
        
        //###events
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
            console.log('sidebar', this);
            _.bindAll(this, 
                'render', 'statistics', 
                'addUser', 'allUsers', 'usersReady',
                'allRooms','addRoom', 'roomsReady'
            );
            console.log('sidebar', this);

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
            
            this.render();
            
            // Set shortcuts to collection DOM
            this.searchInput = this.$('#search');
            this.userList    = this.$('#users');
            this.roomList    = this.$('#rooms');
            this.stats       = this.$('#app-stats');
            
            console.log('sidebar', this);
        },
        
        //###render
        // Render template contents onto the DOM, adding
        // any effects afterwards, such as icons
        render : function() {
            var highlight = {
                    fill : {
                        fill   : "#A90000", 
                        stroke : "none"
                    },
                    none : {
                        fill    : "#9A0000", 
                        opacity : 0
                    }
                };
            
            this.icons = {
                users : _.icon('chat',  'show-rooms', highlight),
                rooms : _.icon('users', 'show-users', highlight)
            };
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
            
            this.stats.html(Mustache.to_html(this.statsTemplate(), {
                totalOnline : totalOnline,
                totalUsers  : totalUsers,
                totalRooms  : totalRooms,
                version     : this.version
            }));
            return this;
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
        },
        
        //###deactivateRoom
        // Remove the current active room from the view,
        // as well as the DOM
        deactivateRoom : function() {
            console.log('deactivate', this);
            this.view.mainContent
                //.fadeOut(50, function(){
                //    $(this).html('');
                //});
                .hide()
                .html('');
            
            // Join Channel
            this.activeRoom && this.activeRoom.remove();
            console.log('deactivate', this);
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
            this.view.mainContent
                .html(self.activeRoom.el)
                .show();
            
            model[0].view && model[0].view.activate();
            
            this.activeRoom.icons = {
                'watch'   : _.icon('view',   'add-favorite'),
                'unwatch' : _.icon('noview', 'remove-favorite'),
                'exit'    : _.icon('cross',  'leave-room'),
                'send'    : _.icon('quote',  'message-submit')
            };
        },
        
        //###usersReady
        // Users collection has been subscribed to
        usersReady : function() {
            // Placeholder
        },
        
        //###deactivateRoom
        // Remove user profile from DOM and view
        deactivateUser : function() {
            this.view.mainContent
                .fadeOut(50, function(){
                    $(this).html('');
                });
                
            this.activeUser && this.activeUser.remove();
        },
        
        //###activateUser
        // Show the user profile / main view
        activateUser : function(params) {
            this.deactivateUser();
            var model = this.model.users.filter(function(user) {
                return user.get('username') === params
                    || user.get('_id') === params;
            });

            if (!model || !model[0]) {
                this.router.invalid();
                return;
            }
            
            this.activeUser = new Views.UserMainView({
                model : model[0]
            });
            
            // Make view accessable to inner-view
            this.activeUser.view = this;
            
            var self = this;
            this.view.mainContent
                .html(self.activeUser.el)
                .show()
                .find('.avatar')
                .fadeIn(1500);
            
            this.activeUser.icons = {
                'watch'   : _.icon('view',   'add-favorite'),
                'unwatch' : _.icon('noview', 'remove-favorite'),
                'exit'    : _.icon('cross',  'leave-room'),
                'send'    : _.icon('quote',  'message-submit')
            };
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
        },
        
        //###addUser
        // Add a single room room to the current veiw
        addUser : function(user) {
            var view = new Views.UserView({
                model : user
            }).render();
            
            this.userList
                .append(view.el);
        }
    });

}).call(this)
