(function(Server){
	// App Initialization
    // ------------------

    // Setup our dnode listeners for Server callbacks
    // as well as model bindings on connection
    DNode()
        .use(Protocols.Backbone)
        .use(Protocols.Pubsub)
        .use(Protocols.Gravatar)
        .connect(function(remote) {
    
            // Load the application once a socket connection is made, 
            // and wait for the DOM to render
            $(function() {
            
                // Save the remote connection for persistance, start 
                // the application, and enable hash url history
                Server = remote;
                new Controllers.Application();
                Backbone.history.start();
            });
        });

})(Server)