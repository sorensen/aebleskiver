(function(document, window) {
    // Bootstrap
    // ------------------
    
    // Predefine all commonly shared objects and storage
    // containers, so that they may be extended and shared
    // throughout the application
    window.ß = {
        Server      : {}, // DNode remote connection
        Store       : {}, // Subscribed model storage
        Helpers     : {}, // Format / UI helpers
        Protocols   : {}, // DNode function protocols
        Models      : {}, // Backbone models
        Views       : {}, // Backbone views
        Controllers : {} // Backbone controllers
    }
})(document, window)