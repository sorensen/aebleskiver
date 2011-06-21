//  Aebleskiver
//  (c) 2011 Beau Sorensen
//  Backbone may be freely distributed under the MIT license.
//  For all details and documentation:
//  https://github.com/sorensen/aebleskiver

(function(document, window) {
    // Bootstrap
    // ---------
    
    // Predefine all commonly shared objects and storage
    // containers, so that they may be extended and shared
    // throughout the application
    window.ß = {
        Server      : {}, // DNode remote connection
        Store       : {}, // Subscribed model storage
        Protocols   : {}, // DNode function protocols
        Models      : {}, // Backbone models
        Views       : {}, // Backbone views
        Connector   : {}, // DNode socket connector
        Routers     : {}  // Backbone routers
    }
})(document, window)