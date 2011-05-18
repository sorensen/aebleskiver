(function(Views) {
    // Message view
    // -----------------
    
    // Single room message
    Views.WebcamView = Backbone.View.extend({
        
        // DOM attributes
        tagName   : 'div',
        className : 'webcam dialog',
        template  : _.template($('#webcam-template').html()),
    
        // Interaction events
        events : {
            "click .snapshot" : "snapshot",
            "click .stream"   : "stream",
            "click .reset "   : "start",
            "click .destroy"  : "remove"
        },
        
        // Constructor
        initialize : function(options) {
            _.bindAll(this, 'render', 'stream', 'snapshot', 'remove');
        },
    
        // Render contents
        render : function() {
            var content = {
            
            }
            var view = Mustache.to_html(this.template(), content);
            $(this.el)
                .html(view)
                .draggable()
                .css({position : 'absolute'});
            
            this.camera = this.$('.camera');
            this.list   = this.$('.list');
            return this;
        },
        
        start : function() {
            var self = this;
            this.list.html('');
            this.camera.webcam({
                width    : 320,
                height   : 240,
                quality  : 50,
                mode     : 'callback',
                extern   : '.camera',
                append   : false,
                swffile  : '/js/webcam/jscam.swf',
                onTick   : function(data) {
                    console.log('WEBCAM onTick', data);
                },
                onSave : function(data) {
                
                    Server.webcam(data, {
                        snapshot : true,
                        user_id  : window.user.get('id')
                    }, function() {
                        console.log('Back from server.');
                        return;
                        
                        d = new Date();
                        $("#test").attr("src", 
                            "/uploads/videos/" + window.user.get('id') + ".png?" + d.getTime()
                        );
                    });
                    
                },
                onCapture : function(data) {
                
                    console.log('WEBCAM onCapture');
                    webcam.save();
                    
                },
                onLoad : function() {
                
                    console.log('WEBCAM onLoad:');
                    var cams = webcam.getCameraList();
                    for(var i in cams) {
                        self.list.append("<li>" + cams[i] + "</li>");
                    }
                    
                }
            });
        },
        
        stream : function() {
            console.log('stream camera', webcam);
            
            _.extend(webcam, {
                mode     : 'stream',
                snapshot : false
            });
            webcam.capture();
        },
        
        snapshot : function() {
            console.log('snapshot', webcam);
            
            _.extend(webcam, {
                mode     : 'callback',
                snapshot : true
            });
            webcam.capture();
        },
        
        // Remove this view from the DOM.
        remove : function() {
            $(this.el).remove();
        }
    });
})(Views)