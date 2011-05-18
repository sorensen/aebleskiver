(function(Protocols) {
    // Miscellanious protocols
    // -----------------------
    
    // Remote protocol
    Protocols.Misc = function(client, con) {
    
        _.extend(this, {
        
            // Personal conversation initialization, 
            // delegated through the server to force a 
            // foreign user to subscribe and create a new 
            // message collection between the two users
            startedConversation : function(resp, options) {
                console.log('startConversation: ', resp)
                
                var to = resp.get('id');
                var from = window.user.get('id');
                var key = (to > from) 
                        ? to + ':' + from
                        : from + ':' + to;
                
                console.log('startConversation: ', key)
                
                if (!window.user.conversations[to]) {
                    window.user.conversations[to] = new Models.MessageCollection();
                    window.user.conversations[to].url = 'pm:' + key;
                        
                    var self = this;
                    window.user.conversations[to].subscribe({}, function() {
                        window.user.conversations[to].messages.fetch({
                            query    : {room_id : key},
                            finished : function(data) {
                            },
                        });
                    });
                }
                
                console.log('startConversation: ', window.user)
            }
        });
    };
    
})(Protocols)