(function(ß) {
    // Miscellanious ß.Protocols
    // -----------------------
    
    // Remote protocol
    ß.Protocols.Misc = function(client, con) {
        var refresh;
        
        // Socket connection has been terminated
        con.on('end', function() {
            // Refresh the page after 10 seconds
            refresh = setTimeout('window.location.reload()', 6000);
        });
        
        // Socket connection established
        con.on('ready', function() {
            clearTimeout(refresh);
        });
        
        // Socket attempted refresh
        con.on('reconnect', function() {
            clearTimeout(refresh);
        });
        
        // Socket connection has been ended by the Server
        con.on('drop', function() {
            // Placeholder
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