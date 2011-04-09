(function(){
	// Application Client
    // ------------------
    
	// Load the application once a socket connection is made, 
	// and wait for the DOM to render
	$(function() {
        new Controllers.Application();
        Backbone.history.start();
	});
    
})()