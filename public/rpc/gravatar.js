(function(Protocols) {
    // Gravatar dnode sync
    // -------------------
    
    Protocols.Gravatar = function() {
    
        // Fetched gravatar
        this.gravatared = function(resp, options) {
            if (!resp) return;
            options.finished && options.finished(resp);
        };
    };
})(Protocols)