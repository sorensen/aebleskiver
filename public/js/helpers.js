(function(Helpers) {
    // Helpers
    // -------
    
    _.extend(Helpers, {
    
        // Format a timestamp from miliseconds to a 
        // human readable string
        timeFormat : function(miliseconds) {
            var now    = new Date(miliseconds);
            var hour   = now.getHours();
            var minute = now.getMinutes();

            // Ensure all times are 2-digits
            if (hour   < 10) { hour   = '0' + hour;   }
            if (minute < 10) { minute = '0' + minute; }

            return '[' + hour + ':' + minute + ']';
        },
        
        // Helper function to get a URL from a Model or Collection as a property
        // or as a function.
        getUrl : function(object) {
            if (!(object && object.url)) return null;
            return _.isFunction(object.url) ? object.url() : object.url;
        },
        
        // Compose an array based on comma seperated values,
        // used for searching / autocompletion
        split : function(val) {
            return val.split(/,\s*/);
        },
        
        // Return the last element of a comma delimited string
        extractLast : function(term) {
            return Helpers.split(term).pop();
        },
        
        // Assign the mongo ObjectID to sync up with 
        // Backbone's 'id' attribute that is used internally,
        // can be used with an array of models or a single one
        getMongoId : function(data) {
            data._id && (data.id = data._id);
            if (_.isArray(data)) {
                _.each(data, function(model, key) {
                    if (model.id && !model._id) data[key]._id = model.id;
                    data[key].id = model._id;
                });
            }
            return data;
        },
        
        // Replace all links found in provided text with 
        // HTML markup for an anchor tag
        linkify : function(text) {
            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            return text.replace(exp,"<a href='$1'>$1</a>"); 
        }
    });
    
})(Helpers)