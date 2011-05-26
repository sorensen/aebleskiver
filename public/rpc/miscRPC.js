(function(Protocols) {
    // Miscellanious protocols
    // -----------------------
    
    // Remote protocol
    Protocols.Misc = function(client, con) {
        
        var refresh;
        
        con.on('end', function() {
            console.log('connection ended');
            
            // Refresh the page after 10 seconds
            refresh = setTimeout('location.reload()', 6000);
        });
        
        con.on('ready', function() {
            console.log('connection ready');
            
            clearTimeout(refresh);
        });
        
        con.on('reconnect', function() {
            console.log('connection reconnect');
            
            clearTimeout(refresh);
        });
        
        con.on('drop', function() {
            console.log('connection dropped');
        });
    
        _.extend(this, {
        
            // Personal conversation initialization, 
            // delegated through the server to force a 
            // foreign user to subscribe and create a new 
            // message collection between the two users
            startedConversation : function(resp, options) {
                console.log('startConversation: ', resp)
                
                var to = resp.id;
                var from = window.user.get('id');
                var key = (to > from) 
                        ? to + ':' + from
                        : from + ':' + to;
                
                console.log('startConversation: ', key)
                
                if (!window.conversations.get(to)) {
                    window.conversations[to] = new Models.MessageCollection();
                    window.conversations[to].url = 'pm:' + key;
                        
                    var self = this;
                    window.conversations[to].subscribe({}, function() {
                        window.conversations[to].messages.fetch({
                            query    : {room_id : key},
                            finished : function(data) {
                            },
                        });
                    });
                }
                
                console.log('startConversation: ', window.conversations)
            }
        });
    };
    
})(Protocols)