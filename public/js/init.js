//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // App Initialization
    // ------------------

    // Predefined storage containers and connection
    // related placeholders
    var Store = this.Store = {},
        initialize,
        refresh,
        connected = false,
        
        // Create the application router, this will only
        // need to be created once, even if we reconnect
        routing = _.once(function() {
            // Wait for the DOM to render
            $(function() {
                new Routers.Application();
            });
        }),
        connect   = function() {
            // Restart the socket connection
            initialize();
            if (!connected) {
                console.log('Connected.');
                clearTimeout(refresh);
                refresh = setTimeout(connect, 20000);
            }
        };
    
    // Setup the reconnection handler for re-establishing the 
    // DNode socket connection in case of disconnect
    var reconnect = function(client, con) {
    
        // Socket connection has been terminated
        con.on('end', function() {
            console.log('Disconnected.');
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
            .use(Auth)
            .use(CRUD)
            .use(Misc)
            .use(Pubsub)
            .use(Avatar)
            .connect(function(remote) {
                Server = remote;
                routing();
            });
    };
    initialize();
})()