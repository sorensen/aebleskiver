(function(Views) {
    // Application view
    // -----------------
    
    // Application
    Views.ApplicationView = Backbone.View.extend({
    
        className : 'wrapper',
        tagName   : 'div',
        template  : _.template($('#application-template').html()),
        events    : {
            "submit #chat-form" : "createChat",
        },
        
        // Constructor
        initialize : function(options) {
            _.bindAll(this, 'render', 'addChat', 'createChat', 'addUser');    
            this.render = _.bind(this.render, this);

            // Set the application model directly, since there is a 
            // one to one relationship between the view and model
            this.model = new Models.ApplicationModel({
            
                // This can be used to represent different
                // servers, or instances of the program, since
                // it is the base ID of every model url path
                id : 's1'
            });
            
            // Bind chats collection
            this.model.users.bind('add', this.addUser);
            this.model.chats.bind('add', this.addChat);
        },
        
        // Render contents
        render : function() {
            // Send model contents to Mustache
            var content = this.model.toJSON();
            var view = Mustache.to_html(this.template(content), content);            
            this.el.html(view);
            
            // Set shortcuts to collection DOM
            this.userList    = this.$('#users');
            this.userInput   = this.$('#create-user');
            this.chatList    = this.$('#chats');
            this.chatInput   = this.$('#create-chat');
            this.mainContent = this.$('#main-content');
            
            return this;
        },
        
        // Add a single chat room to the current veiw
        addUser : function(user) {
            var view = new Views.UserView({
                model : user
            }).render();
            
            this.userList
                .append(view.el);
        },
        
        // Add a single chat room to the current veiw
        addChat : function(chat) {
            // Probably shouldn't have to set this here
            //chat.messages.url = chat.collection.url + ":" + chat.id + ":messages";
            
            var view = new Views.ChatView({
                model : chat
            }).render();
            
            this.chatList
                .append(view.el);
        },
        
        deactivateChat : function() {
            this.mainContent
                .fadeOut(50, function(){
                    $(this).html('');
                });
            
            // Join Channel
            this.activeChat && this.activeChat.remove();
        },
        
        activateChat : function(params) {
            this.deactivateChat();
            
            // Get model by name
            var model = this.model.chats.get(params);
            if (!model) return;
        
            console.log('activateChat: ', this);
            console.log('activateChat: ', model);
        
            this.activeChat = new Views.ChatMainView({
                model : model
            }).render();
            
            
            var self = this;
            this.mainContent
                .fadeIn(150, function(){
                    $(this).html(self.activeChat.el);
                    self.activeChat.messagelist.scrollTop(
                    
                        // Scroll to the bottom of the message window
                        self.activeChat.messagelist[0].scrollHeight
                    );
                    delete self;
                });
        },
        
        // Generate the attributes for a new chat
        newChatAttributes : function() {
            return {
                name : this.chatInput.val()
            };
        },
        
        // Create new chat room
        createChat : function() {
            if (!this.chatInput.val()) return;
            this.model.createChat(this.newChatAttributes());
            this.chatInput.val('');
        },
    });
})(Views)