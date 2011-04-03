(function() {
    // Application models
    // ------------------
    
    // The app contains users, chat rooms, messages, and 
    // one overall 'world' to hold everything
    var Models;
    if (typeof exports !== 'undefined') {
        _           = require('underscore')._;
        Backbone    = require('backbone');
        Models      = exports;
    } else {
        Models = this.Models = {};
    }
    
    // User
    Models.UserModel = Backbone.Model.extend({
        
        defaults : {
            'username'   : 'anonymous',
            'gravatar'   : 'images/undefined.png',
            'status'     : 'offline',
            'statistics' : {
                'games'  : 0,
                'clicks' : 0,
                'wins'   : 0,
                'losses' : 0,
                'score'  : 0
            },
        },
        initialize : function(options) {
            this.deck = new Models.CardCollection();
        },
    });
    
    // Cards
    Models.CardModel = Backbone.Model.extend({
        defaults : {
            'suit' : 'clubs',
            'value' : 1,
        },
        initialize : function(options) {
        },
    });
    
    // Message
    Models.MessageModel = Backbone.Model.extend({
        defaults : {
        },
        initialize : function(options) {
        },
    });
    
    // Chat room
    Models.ChatModel = Backbone.Model.extend({
        defaults : {
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
            this.destroy();
            this.view.remove();
        },
        // Remove this delete its view.
        leaveChannel : function() {
            this.view.leaveChannel();
        }
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
    
    // Card Collection
    Models.CardCollection = Backbone.Collection.extend({
        
        model : Models.MessageModel,
        url   : 'cards',
        name  : 'cards',
        
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
        }
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
    Models.WorldModel = Backbone.Model.extend({
        name     : 'worlds',
        urlRoot  : 'worlds',
        defaults : {
            'name'  : 'World',
            'counter' : 0,
            'users' : [],
            'chats' : []
        },
        initialize : function(options) {
            this.users = new Models.UserCollection();
            this.users.url = 'worlds:' + this.id + ':users';
            
            this.chats = new Models.ChatCollection();
            this.chats.url = 'worlds:' + this.id + ':chats';
        }
    });
})()