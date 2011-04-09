(function(Protocol, Server) {
    // Gravatar dnode sync
    // -------------------
    
    Gravatar = this.Gravatar = {};
    Server   = this.Server = this.Gravatar.Server = Synchronize.Server || false;
    
    var cb = function(){
        //TODO:
    };
    
    var connected = function(model, options) {
        Server.gravatar(model, options, cb);
    };
        
    // Remote protocol
    Protocol.Gravatar = function() {
    
        // Fetched gravatar
        this.gravatared = function(data, opt, cb) {
            console.log('Gravatared: ', data);
            // Compare URL's to update the right collection
            if (!data) return;
            
            opt.finished && opt.finished(data);
        };
    };
        
    // Transport methods for model storage, sending data 
    // through the socket instance to be saved on the Server 
    Gravatar = function(model, options) {
        options = options || {};
        
        // Connect to DNode Server only once
        if (!Server) DNode(GProtocol).connect(function(remote) {
            Server = remote;
            connected(model, options);
        });
        else connected(model, options);
    };
    //_.extend(Protocol, Gravatar);
    if (typeof exports !== 'undefined') module.exports = Gravatar;
})(Protocol, Server)