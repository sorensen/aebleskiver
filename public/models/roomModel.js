(function(Models) {
    // Room model
    // ------------------
    
    // Room room
    Models.RoomModel = Backbone.Model.extend({
    
        type  : 'room',
        
        defaults : {
            name     : 'Unknown',
            messages : [],
            tags     : [
                'general'
            ],
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            var self = this;
            this.messages.unsubscribe({}, function(resp) {
                self.messages.each(function(message) {
                    //message.clear();
                });
            });
        },
    });
    
    // Room Collection
    Models.RoomCollection = Backbone.Collection.extend({
        
        model : Models.RoomModel,
        url   : 'rooms',
        type  : 'room',
        
        // Initialize
        initialize : function(options) {
        }
    });
    
})(Models)