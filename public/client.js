(function(){
	// Application Client
    // ------------------
    
	// Load the application once a socket connection is made, 
	// and wait for the DOM to render
	$(function() {
    
		// Attach the application
		window.Application = new Views.ApplicationView({
        
			// Use existing DOM element
			el   : $("#wrapper"),
            
            // Username provided by the Node session
            // on the initial page render
            user : $('#client .username')
		});
	});
})()