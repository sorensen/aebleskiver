(function(Models) {
    // Chat model
    // ------------------
    
    // Chat room
    Models.ChatModel = Backbone.Model.extend({
        defaults : {
            'created' : true,
            'name' : 'Unknown',
            'tags' : [
                'general'
            ],
            'messages' : [],
        },
        // Initialize
        initialize : function(options) {
            this.messages = new Models.MessageCollection();
        },
    });
    
    // Chat Collection
    Models.ChatCollection = Backbone.Collection.extend({
        
        model : Models.ChatModel,
        url   : 'chats',
        name  : 'chats',
        
        // Initialize
        initialize : function(options) {
        }
    });
    
})(Models)