(function(ß) {
    // Miscellanious Protocols
    // -----------------------
    
    var refresh,
        connected = false,
        connect   = function() {
            // Restart the socket connection
            ß.Initialize();
            if (!connected) {
                console.log('try again?', connected);
                clearTimeout(refresh);
                refresh = setTimeout(connect, 20000);
            }
        };
    
    // Remote protocol
    ß.Protocols.Misc = function(client, con) {
        
        // Socket connection has been terminated
        con.on('end', function() {
            console.log('misc.dnode: Connection ended:', con);
            // Refresh the page after 10 seconds
            connected = false;
            refresh = setTimeout(connect, 500);
            
        });
        
        // Socket connection established
        con.on('ready', function() {
            connected = true;
            clearTimeout(refresh);
            console.log('misc.dnode: Connection ready:', connected);
        });
    
        _.extend(this, {
            // Personal conversation initialization, 
            // delegated through the server to force a 
            // foreign user to subscribe and create a new 
            // message collection between the two users
            startedConversation : function(resp, options) {
                var to = resp.id || resp._id,
                    from = ß.user.get('id'),
                    key = (to > from) 
                        ? to + ':' + from
                        : from + ':' + to;
                
                if (!ß.user.conversations.get(key)) {
                    var convo = new ß.Models.ConversationModel({
                        to   : to,
                        id   : key,
                        name : resp.displayName || resp.username
                    });
                    convo.url = 'pm:' + key;
                    ß.user.conversations.add(convo);
                }
            }
        });
    };
})(ß)