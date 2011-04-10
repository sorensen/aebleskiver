(function(Protocols, Server) {
    // Gravatar dnode sync
    // -------------------
    
    Protocols.Gravatar = function() {
    
        // Fetched gravatar
        this.gravatared = function(resp, options) {
            console.log('Gravatared: ', resp);
            // Compare URL's to update the right collection
            if (!resp) return;
            
            opt.finished && opt.finished(resp);
        };
    };
    
})(Protocols, Server)