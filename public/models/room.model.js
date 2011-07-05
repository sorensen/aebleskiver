//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // Room models
    // -----------
    
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Models;
    if (typeof exports !== 'undefined') {
        Models = exports;
    } else {
        Models = this.Models || (this.Models = {});
    }
    
    //##Room
    // Basic and default room of the application
    Models.RoomModel = Backbone.Model.extend({
    
        // Server communication settings
        type : 'room',
        sync : _.sync,
        
        // Model defaults
        defaults : {
            name      : 'Unknown',
            messages  : [],
            upvotes   : 0,
            downvotes : 0,
            rank      : 0,
            banned    : []
        },
        
        //###remove
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
        },
        
        //###allowedToEdit
        // Client side editing validation, allowed to edit
        // if the supplied user is the one that created the room
        allowedToEdit : function(user) {
            if (!user.get('id') || !this.get('user_id')) {
                return false;
            }
            return user.get('id') === this.get('user_id');
        },
        
        //###allowedToView
        // Client side read validation, allowed to view if
        // user ID is not contained in the 'banned' array
        allowedToView : function(user) {
            return _.indexOf(this.get('banned'), user.get('id')) === -1;
        }
    });
    
    //##PrivateRoom
    // To be used when a room has been set to 'restricted', changes
    // in default behavior and admin abilities
    Models.PrivateRoomModel = Models.RoomModel.extend({
    
        // Default attributes
        defaults : {
            name      : 'Unknown',
            messages  : [],
            allowed   : [],
            banned    : []
        },
        
        //###allowedToView
        // Client side view validation, only allowed to view if
        // the user ID has been white-listed in the 'allowed' array
        allowedToView : function(user) {
            return _.indexOf(this.get('allowed'), user.get('id')) !== -1
                || user.get('id') === this.get('user_id');
        }
    });
    
    //##Collection
    // Container for all models, mainly used for the listing of 
    // many models, providing server communication and events
    Models.RoomCollection = Backbone.Collection.extend({
        
        // Server communication settings
        model : Models.RoomModel,
        url   : 'rooms',
        type  : 'room',
        sync  : _.sync,
        
        //###comparator
        // Sort rooms based on what the current ranking is, 
        // weighted by how long ago it was created, giving more
        // presence to the high ranking and newly created rooms
        comparator : function(room) {
            var now        = new Date().getTime(),
                then       = new Date(room.get('created')).getTime(),
                comparison = (now - then) / 500000;
        
            return room.get('downvotes') - room.get('upvotes') + comparison;
        }
    });
    
    // Conversations
    // -------------
    
    // Extentions of the basic room type, to be used for user to user
    // 'conversations', seperated out for further admin controls
    
    //##Conversation
    // Override the basic room model to change the attributes, 
    // marking the room as a user to user conversation
    Models.ConversationModel = Models.RoomModel.extend({
        defaults : {},
        type     : 'conversation'
    });
    
    //##Collection
    // Main container, server, and event propegator for all rooms
    Models.ConversationCollection = Models.RoomCollection.extend({
        
        // Server communication settings
        model : Models.ConversationModel,
        url   : 'conversations',
        type  : 'conversation'
    });
})()