// RPC Protocol
// ----------------

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    _      = require('underscore')._;
    Canvas = require('canvas');
    fs     = require('fs')
    
    var canvas = new Canvas(320, 240);
    var ctx    = canvas.getContext('2d');
    var image  = ctx.getImageData(0, 0, 320, 240);
    var pos = 0;
} else {
    this.Protocol = Protocol = {};
}

// Define server-callable methods
Protocol = module.exports = function(client, con) {
    var self = this;
    _.extend(this, {
    
        savePicture : function(data, options, next) {
            if (!options.user_id) {
                options.error && options.error(400, options, next);
                next && next(data, options);
                return;
            }
            
            var out = fs.createWriteStream(__dirname 
                + '/../public/uploads/users/' + options.user_id + '.png');
                
            var stream = canvas.createPNGStream();
            
            stream.on('data', function(chunk){
                out.write(chunk);
            });

            stream.on('end', function(){
                console.log('saved snapshot');
            });
            
            next && next(data, options);
        },
        
        webcam : function(data, options, next) {
            if (!options.user_id) {
                options.error && options.error(400, options, next);
                next && next(data, options);
                return;
            }
        
            var col = data.split(";");
            var img = image;
            
            for(var i = 0; i < 320; i++) {
                var tmp = parseInt(col[i]);
                img.data[pos + 0] = (tmp >> 16) & 0xff;
                img.data[pos + 1] = (tmp >> 8) & 0xff;
                img.data[pos + 2] = tmp & 0xff;
                img.data[pos + 3] = 0xff;
                pos+= 4;
            }
            
            if (pos >= 0x4B000) {
                ctx.putImageData(img, 0, 0);
                pos = 0;
                
                if (options.snapshot) {
                    this.savePicture(data, options);
                    delete options.snapshot;
                    return;
                }
                
                var out = fs.createWriteStream(__dirname 
                    + '/../public/uploads/videos/' + options.user_id + '.png');
                    
                var stream = canvas.createPNGStream();
                
                stream.on('data', function(chunk){
                    out.write(chunk);
                });

                stream.on('end', function(){
                    console.log('saved video');
                    next && next();
                });
                
            
                /**
                canvas.toBuffer(function(err, buf){
                    if (err) throw err;
                    fs.writeFile(__dirname + '/../public/uploads/videos/' + options.user_id + '.png', buf, function(err) {
                        if (err) throw err;
                        next && next();
                    });
                });
                canvas.toDataURL('image/png', function(err, str) {
                    // Publish based by channel
                    _.each(Clients, function(someone) {
                        console.log('someone', someone);
                        someone.recorded('<img src="' + str + '" />')
                    });
                    next && next('<img src="' + str + '" />');
                });
                **/
            }
            
        },
    
    });
};