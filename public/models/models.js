(function() {
    // Application models
    // ------------------
    
    // The app contains users, chat rooms, messages, and 
    // one overall 'world' to hold everything
    var Models;
    if (typeof exports !== 'undefined') {
        // Server exports
        _        = require('underscore')._;
        Backbone = require('backbone');
        Models   = exports;
    } else {
        // Client include
        Models = this.Models = {};
    }
    
    // User
    Models.UserModel = Backbone.Model.extend({
        
        urlRoot  : 'users',
        name     : 'users',
        defaults : {
            'created' : true,
            'messages' : [],
            'username' : 'anonymous',
            'gravatar' : 'images/undefined.png',
            'status'   : 'offline',
            'statistics' : {
            },
        },
        
        initialize : function(options) {
        
        },
    });
    
    // User
    Models.ModeratorModel = Models.UserModel.extend({
        
        initialize : function(options) {
        
        },
    });
    
    // Message
    Models.MessageModel = Backbone.Model.extend({
        defaults : {
            //'created' : new Date().getTime(),
        },
        
        initialize : function(options) {
        },
        
        // Remove this delete its view.
        clear : function() {
            this.view.remove();
        },
    });
    
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
        // Remove this delete its view.
        clear : function() {
            //this.view.remove();
        },
    });
    
    // User Collection
    Models.UserCollection = Backbone.Collection.extend({
        
        model : Models.UserModel,
        url   : 'users',
        name  : 'users',
        
        // Initialize
        initialize : function(options) {
        }
    });
    
    // Message Collection
    Models.MessageCollection = Backbone.Collection.extend({
        
        model : Models.MessageModel,
        url   : 'messages',
        name  : 'messages',
        
        // Initialize
        initialize : function(options) {
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
    
    // World Model
    Models.ApplicationModel = Backbone.Model.extend({
    
        name     : 'app',
        urlRoot  : 'app',
        defaults : {
            'visits'  : 0,
            // Collection lookups
            'users'   : [],
            'chats'   : []
        },
        initialize : function(options) {
            // Current user collection
            this.users = new Models.UserCollection();
            this.users.url = 'app:' + this.id + ':users';
            
            // Active chat collection
            this.chats = new Models.ChatCollection();
            this.chats.url = 'app:' + this.id + ':chats';
        }
    });
})()