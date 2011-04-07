(function(){
	// UI Helpers
    // ----------
    
	// Wait for jQuery
	$(function() {
        // Buttons
        $("input:submit, .button, button").livequery(function() {
            $(this).button();
        });
        
        // Remove unwanted hover / focus events from JUI
        $("body :input, input[type='text'], input[type='password'], input[type='textarea'], textarea").livequery(function(){
            $(this).wijtextbox()
                .bind("focus", function() {
                        $(this).addClass("ui-state-hover");
                    })
                .bind("blur", function() {
                        $(this).removeClass("ui-state-hover");		
                    })
                .unbind('mouseover').unbind('mouseout').unbind('mousedown').unbind('mouseup');
        })
	});
})()