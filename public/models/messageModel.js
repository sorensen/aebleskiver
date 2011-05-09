(function(Models) {
    // Message model
    // ------------------
    
    // Single message model
    Models.MessageModel = Backbone.Model.extend({
    
        type  : 'message',
        
        // Default model attributes
        defaults : {
            text     : '',
            username : '',
            avatar   : ''
        },
        
        // Constructor
        initialize : function(options) {
        },
        
        // Remove model along with the view
        clear : function() {
            this.view.remove();
        },
        
        // Parse data from the server to convert any 
        // links to HTML output
        parse : function(resp) {
            //resp.text && (resp.text = Helpers.linkify(resp.text));
            return resp;
        }
    });
    
    // Message Collection
    Models.MessageCollection = Backbone.Collection.extend({
        
        model : Models.MessageModel,
        url   : 'messages',
        type  : 'message',
        
        // Constructor
        initialize : function(options) {
        },
        
        comparator : function(message) {
            return new Date(message.get('created')).getTime();
        },
        
        // Parse data from the server to convert any 
        // links to HTML output
        parse : function(resp) {
            _.each(resp, function(record, index) {
            
                //resp[index].text && (resp[index].text = Helpers.linkify(record.text));
            });
            return resp;
        }
    });

})(Models)