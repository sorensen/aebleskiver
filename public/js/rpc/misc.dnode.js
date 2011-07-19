//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

//(function() {
    // Miscellaneous middleware
    // ------------------------
    
    // Save a reference to the global object.
    var root = this;
    
    // The top-level namespace. All public classes and modules will
    // be attached to this.
    var misc = root.misc;
    
    // Remote protocol
    misc = function(client, con) {
    
        _.extend(this, {
            // Personal conversation initialization, 
            // delegated through the server to force a 
            // foreign user to subscribe and create a new 
            // message collection between the two users
            startedConversation : function(resp, options) {
                var to = resp.id || resp._id,
                    from = window.user.get('id'),
                    key = (to > from) 
                        ? to + ':' + from
                        : from + ':' + to;
                
                if (!window.user.conversations.get(key)) {
                    var convo = new Models.ConversationModel({
                        to   : to,
                        id   : key,
                        name : resp.displayName || resp.username
                    });
                    convo.url = 'pm:' + key;
                    window.user.conversations.add(convo);
                }
            }
        });
    };
    
    if (typeof root.misc === 'undefined') root.misc = misc;
    if (typeof exports !== 'undefined') module.exports = misc;
//})()
