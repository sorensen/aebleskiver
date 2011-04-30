(function(Models) {
    // Application model
    // -----------------
    
    // World Model
    Models.ApplicationModel = Backbone.Model.extend({
    
        type     : 'application',
        urlRoot  : 'app',
        
        defaults : {
            server  : 's1',
            visits  : 0,
            users   : [],
            rooms   : []
        },
        
        createRoom : function(attr) {
            if (!attr) return;
            this.rooms.create(attr, {
                error    : function(msg, resp, options) {},
                finished : function(resp) {
                }
            });
        },
        
        initialize : function(options) {
            
            // Grab the authentication token and remove it from the DOM
            var sid = $('#token').html();
            
            // Current user collection
            this.users = new Models.UserCollection();
            this.users.url = this.url() + ':users';
            
            // Active room collection
            this.rooms = new Models.RoomCollection();
            this.rooms.url = this.url() + ':rooms';
            
            var self = this;
            // Subscribing to a model can be continued by just 
            // passing a callback, though, it will still execute a
            // 'finished' function if you pass one in theim n options
            this.subscribe({}, function(resp) {
            
                // Sync up with the server through DNode, Backbone will
                // supply the channel url if one is not supplied
                self.rooms.subscribe({}, function(resp) {
                
                    self.rooms.fetch({
                        query : {
                        },
                        error : function(code, msg, opt) {
                            console.log('fetch error', code); 
                            console.log('fetch error', msg); 
                            console.log('fetch error', opt); 
                        },
                        finished : function(resp) {
                            console.log('rooms fetched', resp);
                            
                            // Start history once we have model data
                            Backbone.history.start();
                        },
                    });
                });
                
                // Sync up with the server through DNode, Backbone will
                // supply the channel url if one is not supplied
                self.users.subscribe({}, function(resp) {
                
                    // Create a new user for the current client, only the 
                    // defaults will be used until the client authenticates
                    // with valid credentials
                    window.user = new Models.UserModel();
                    /**
                    var params = {
                        token : sid,
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
                    Server.getSession(window.user.toJSON(), params, function(session, options) {
                        if (!session) return;
                        
                        if (session.user) {
                            window.user.set(session.user);
                            
                            console.log('session.user: ', window.user);
                        }
                        
                        self.users.fetch({
                            query : {status : 'online'},
                            error : function(code) { 
                                console.log('users fetch error', code); 
                            },
                            success : function(resp) {
                                console.log('users fetched', resp);
                            },
                        });
                    });
                    **/
                });
            });
        }
    });
    
})(Models)