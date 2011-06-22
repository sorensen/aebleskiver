//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function(ß) {
    // App Initialization
    // ------------------

    // Create the application router, this will only
    // need to be created once, even if we reconnect
    routing = _.once(function() {
        // Wait for the DOM to render
        $(function() {
            new ß.Routers.Application();
        });
    });
    
    // Seperate the connection function in case
    // we need to use it for reconnecting
    ß.Connector = function(remote) {
        console.log('init: Connecting...', remote);
    
        // Save the remote connection for persistance, start 
        // the application, and enable hash url history
        ß.Server = remote;
        delete remote;
        routing();
    };
    
    // Setup our dnode listeners for ß.Server callbacks
    // as well as model bindings on connection
    DNode()
        .use(ß.Protocols.Auth)
        .use(ß.Protocols.CRUD)
        .use(ß.Protocols.Misc)
        .use(ß.Protocols.Pubsub)
        .use(ß.Protocols.Upload)
        .use(ß.Protocols.Gravatar)
        .connect(ß.Connector);
})(ß)