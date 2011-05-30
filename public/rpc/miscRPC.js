(function(Protocols) {
    // Miscellanious protocols
    // -----------------------
    
    // Remote protocol
    Protocols.Misc = function(client, con) {
        
        var refresh;
        
        con.on('end', function() {
            console.log('connection ended');
            
            // Refresh the page after 10 seconds
            refresh = setTimeout('DNode.connect()', 6000);
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
                console.log('FORCE START: ', resp)
                
                var to = resp.id || resp._id;
                var from = window.user.get('id');
                var key = (to > from) 
                        ? to + ':' + from
                        : from + ':' + to;
                
                console.log('FORCE START: ', key)
                
                if (!window.conversations.get(key)) {
                
                    var convo = new Models.ConversationModel({
                        to   : to,
                        id   : key,
                        name : resp.displayName || resp.username
                    });
                    convo.url = 'pm:' + key;
                    
                    window.conversations.add(convo);
                }
                
                console.log('FORCE START: ', window.conversations)
            }
        });
    };
    
})(Protocols)