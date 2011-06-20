(function(ß) {
    // Room model
    // ------------------
    
    // Room room
    ß.Models.RoomModel = Backbone.Model.extend({
    
        type  : 'room',
        
        defaults : {
            name      : 'Unknown',
            messages  : [],
            upvotes   : 0,
            downvotes : 0,
            rank      : 0,
            banned    : []
        },
        
        // DNode persistence
        sync : _.sync,
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
        },
        
        // Client side editing validation, allowed to edit
        // if the supplied user is the one that created the room
        allowedToEdit : function(user) {
            if (!user.get('id') || !this.get('user_id')) {
                return false;
            }
            return user.get('id') === this.get('user_id');
        },
        
        // Client side read validation, allowed to view if
        // user ID is not contained in the 'banned' array
        allowedToView : function(user) {
            return _.indexOf(this.get('banned'), user.get('id')) === -1;
        }
    });
    
    ß.Models.PrivateRoomModel = ß.Models.RoomModel.extend({
    
        defaults : {
            name      : 'Unknown',
            messages  : [],
            allowed   : [],
            banned    : []
        },
        
        // Client side view validation, only allowed to view if
        // the user ID has been white-listed in the 'allowed' array
        allowedToView : function(user) {
            return _.indexOf(this.get('allowed'), user.get('id')) !== -1
                || user.get('id') === this.get('user_id');
        }
        
    });
    
    // Room Collection
    ß.Models.RoomCollection = Backbone.Collection.extend({
        
        model : ß.Models.RoomModel,
        url   : 'rooms',
        type  : 'room',
        
        // DNode persistence
        sync : _.sync,
        
        // Initialize
        initialize : function(options) {
        },
        
        // Sorting for rankings
        comparator : function(room) {
            var now        = new Date().getTime(),
                then       = new Date(room.get('created')).getTime(),
                comparison = (now - then) / 500000;
        
            return room.get('downvotes') - room.get('upvotes') + comparison;
        }
    });
        
    ß.Models.ConversationModel = ß.Models.RoomModel.extend({
    
        defaults : {},
        type     : 'conversation',
    });
    
    ß.Models.ConversationCollection = ß.Models.RoomCollection.extend({
        
        model : ß.Models.ConversationModel,
        url   : 'conversations',
        type  : 'conversation',
        
    });
    
})(ß)