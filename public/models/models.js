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
            "username" : "anonymous",
            "gravatar" : "images/undefined.png"
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
            "name" : "Unknown",
            "tags" : [
                'general'
            ],
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
        //rpc   : new Synchronize(this, {fetch : true}),
        
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
        
            var self = this;
            //this.rpc = new Synchronize(self, {fetch : true});
        }
    });
    
    // Chat Collection
    Models.ChatCollection = Backbone.Collection.extend({
        
        model : Models.ChatModel,
        url   : 'chats',
        name  : 'chats',
        //rpc   : new Synchronize(this, {fetch : true}),
        
        // Initialize
        initialize : function(options) {
        
            var self = this;
            console.log('model', this);
            console.log('model', self);
            
            //this.rpc = new Synchronize(this, {fetch : true});
        }
    });
    
    // World Model
    Models.WorldModel = Backbone.Model.extend({
        defaults : {
            "name" : "World"
        },
        initialize : function(options) {
            this.users = new Models.UserCollection();
            this.users.url = 'worlds:' + this.id + ':users';
            
            this.chats = new Models.ChatCollection();
            this.chats.url = 'worlds:' + this.id + ':chats';
        }
    });
})()