//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// App Initialization
// ------------------

(function() {
    // Save a reference to the global object.
    var root = this;
    
    // Predefined storage containers and connection
    // related placeholders
    var connected  = false,
        Store      = root.Store = {},
        initialize,
        refresh,
        
        // Create the application router, this will only
        // need to be created once, even if we reconnect
        routing = _.once(function(remote) {
        
            // Wait for the DOM to render
            $(function() {
                new Routers.Application({ 
                    server : remote
                });
            });
        }),
        connect = function() {
            // Restart the socket connection
            initialize();
            if (!connected) {
                clearTimeout(refresh);
                refresh = setTimeout(connect, 20000);
            }
        };
    
    // Setup the reconnection handler for re-establishing the 
    // DNode socket connection in case of disconnect, this can 
    // likely be removed on the next update of DNode/Socket.io, 
    // as reconnect methods are now built in
    var reconnect = function(client, con) {
    
        // Socket connection has been terminated
        con.on('end', function() {
            connected = false;
            refresh = setTimeout(connect, 500);
        });
        
        // Socket connection established
        con.on('ready', function() {
            connected = true;
            clearTimeout(refresh);
        });
    };
    
    // Seperate the connection function in case
    // we need to use it for reconnecting
    initialize = function() {
    
        // Setup our dnode listeners for Server callbacks
        // as well as model bindings on connection, save
        // the remote connection for persistance, start 
        // the application, and enable hash url history
        DNode()
            .use(reconnect)
            .use(middleware.crud)
            .use(middleware.pubsub)
            .use(avatar)
            .use(auth)
            .use(misc)
            .connect(function(remote) {
                // Set the server for model and views, then 
                // start the main router for the application
                Server = remote;
                routing(remote);
            });
    };
    initialize();

}).call(this)
