//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Helper functions
// ----------------

(function() {
    // Save a reference to the global object.
    var root = this;
  
    // Require Underscore, if we're on the server, and it's not already present.
    var _ = root._;
    if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;
    
    // Extend the underscore object and pass
    // it our hash of function mixins
    _.mixin({

        // ###timeFormat
        // Format a timestamp from miliseconds to a 
        // human readable string
        timeFormat : function(miliseconds) {
            var now    = new Date(miliseconds),
                hour   = now.getHours(),
                minute = now.getMinutes();

            // Ensure all times are 2-digits
            if (hour   < 10) { hour   = '0' + hour;   }
            if (minute < 10) { minute = '0' + minute; }
            return '[' + hour + ':' + minute + ']';
        },

        // ###split
        // Compose an array based on comma seperated values,
        // used for searching / autocompletion
        split : function(val) {
            return val.split(/,\s*/);
        },

        // ###extractLast
        // Return the last element of a comma delimited string
        extractLast : function(term) {
            return _.split(term).pop();
        },

        // ###linkify
        // Replace all links found in provided text with 
        // HTML markup for an anchor tag
        linkify : function(text) {
            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            return text.replace(exp,"<a href='$1'>$1</a>"); 
        }
    });

}).call(this)
