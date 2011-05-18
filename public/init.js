(function() {
    // App Initialization
    // ------------------

    // Setup our dnode listeners for Server callbacks
    // as well as model bindings on connection
    DNode()
        .use(Protocols.Auth)
        .use(Protocols.CRUD)
        .use(Protocols.Misc)
        .use(Protocols.Pubsub)
        .use(Protocols.Upload)
        .use(Protocols.Gravatar)
        .connect(function(remote) {
            
            // Save the remote connection for persistance, start 
            // the application, and enable hash url history, wait 
            // for the DOM to render before starting main controller
            Server = remote;
            
            $(function() {
                new Controllers.Application();
            });
        });
})()