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
        
        // Populate room with messages
        populate : function() {
            this.messages = new Models.MessageCollection();
            this.messages.url = this.url() + ':messages';
            
            var self = this;
            var params = {
            };
            this.messages.subscribe(params, function() {
            
                var params = {
                    finished : function(data) {
                    },
                };
                self.messages.fetch(params);
            });
        },
        
        // Remove this view from the DOM, and unsubscribe from 
        // all future updates to the message collection
        remove : function() {
            var self = this;
            var params = {
                error    : function(data) {},
                finished : function(data) {},
            };
            this.messages.unsubscribe(params, function(resp) {
                self.messages.each(function(message) {
                    //message.clear();
                });
            });
        },
        
        // Create and send a new message
        createMessage : function(attr) {
            this.messages.create(attr);
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