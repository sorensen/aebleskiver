(function(Protocols) {
    // Backbone dnode sync
    // -------------------
    
    // Remote protocol
    Protocols.Upload = function(client, con) {
    
    
        _.extend(this, {
            // New subscription received
            recorded : function(resp) {
                console.log('Webcamed:.', resp);
                $('#webcam-receive').html(resp);
            },
            
            // File uploaded
            uploaded : function(resp) {
                console.log('uploaded:.', resp);
            }
        });
    
    };
    
})(Protocols)