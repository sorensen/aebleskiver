(function(ß) {
    // App Initialization
    // ------------------

    // Setup our dnode listeners for ß.Server callbacks
    // as well as model bindings on connection
    DNode()
        .use(ß.Protocols.Auth)
        .use(ß.Protocols.CRUD)
        .use(ß.Protocols.Misc)
        .use(ß.Protocols.Pubsub)
        .use(ß.Protocols.Upload)
        .use(ß.Protocols.Gravatar)
        .connect(function(remote) {
            
            // Save the remote connection for persistance, start 
            // the application, and enable hash url history
            ß.Server = remote;
            delete remote;
            
            // Wait for the DOM to render before starting main controller
            $(document).ready(function() {
                new ß.Controllers.Application();
            });
        });
})(ß)