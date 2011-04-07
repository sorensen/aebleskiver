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
            'created'  : new Date().getTime(),
            'cards'    : [],
            'messages' : [],
            'username' : 'anonymous',
            'gravatar' : 'images/undefined.png',
            'status'   : 'offline',
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
            'rank' : 1,
        },
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
            'created' : new Date().getTime(),
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
        // Remove this delete its view.
        leaveChannel : function() {
            //this.view.leaveChannel();
        }
    });
    
    // World Model
    Models.GameModel = Backbone.Model.extend({
        name     : 'games',
        urlRoot  : 'games',
        defaults : {
            'name'     : 'Game Name',
            'counter'  : 0,
            'users'    : [],
            'messages' : []
        },
        initialize : function(options) {
            this.users = new Models.UserCollection();
            this.users.url = 'games:' + this.id + ':users';
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
        },
        /**
        // Todos are sorted by their original insertion order.
        comparator: function(message) {
            return message.get('created');
        },
        
        // Filter down the list of all todo items that are finished.
        done: function() {
            return this.filter(function(message){ return todo.get('read'); });
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function() {
            return this.without.apply(this, this.done());
        },
        **/
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
    
    // Chat Collection
    Models.GameCollection = Backbone.Collection.extend({
        
        model : Models.GameModel,
        url   : 'games',
        name  : 'games',
        
        // Initialize
        initialize : function(options) {
        }
    });
    
    // World Model
    Models.ApplicationModel = Backbone.Model.extend({
        name     : 'app',
        urlRoot  : 'app',
        defaults : {
            'created' : new Date().getTime(),
            'title'   : 'aebleskiver',
            'visits'  : 0,
            'users'   : [],
            'games'   : [],
            'chats'   : []
        },
        initialize : function(options) {
            this.users = new Models.UserCollection();
            this.users.url = 'app:' + this.id + ':users';
            this.games = new Models.GameCollection();
            this.games.url = 'app:' + this.id + ':games';
            this.chats = new Models.ChatCollection();
            this.chats.url = 'app:' + this.id + ':chats';
        }
    });
})()