(function(Controllers) {
    // Application
    // ----------
    
    // Main controller and router
    Controllers.Application = Backbone.Controller.extend({
    
        // Definitions
        routes : {
            '/chats/:id' : 'joinChat',
            "*route"    : "invalid",
        },
        
        // Default action
        invalid : function(route) {
            console.log('Router: invalid: ', route);
            this.saveLocation('/');
        },
        
        // Join a chat room
        joinChat : function(id) {
            console.log('Router: join chat', id);
            if (!id) return;
            this.view.activateChat(id);
        },
        
        initialize : function(options) {
        
            console.log('controller', Models);
            // Attach the application
            Application = this.view = new Views.ApplicationView({
                // Use existing DOM element
                el : $("#wrapper")
            });
            
            // Circular reference
            this.view.controller = this;
        },
    });
})(Controllers)