// Application Server
// ------------------
require.paths.unshift(__dirname + '/lib');

// Dependencies
var express      = require('express'),
    SessionStore = require('connect-mongodb'),
    Mongoose     = require('mongoose');
    
    fs           = require('fs'),
    Seq          = require('seq'),
    formidable   = require('formidable'),
    sys          = require('sys'),
    Upload       = require('protocol-upload'),
    Misc         = require('protocol-misc'),
    PubSub       = require('protocol-pubsub'),
    CRUD         = require('protocol-crud'),
    Gravatar     = require('protocol-gravatar'),
    Auth         = require('protocol-auth'),
    DNode        = require('dnode'),
    version      = '0.3.1',
    port         = 3000,
    token        = '',
    server       = module.exports = express.createServer();

// Server configuration
server.configure(function() {
    // View settings
    server.use(express.bodyParser());
    server.use(express.cookieParser());
    server.use(express.methodOverride());
    server.use(express.static(__dirname + '/public'));
    server.set('view engine', 'jade');
    server.set('view options', {layout : false});
    
    // Session settings
    server.use(express.session({
        cookie : {maxAge : 60000 * 60 * 24},   // 24 Hours
        secret : 'abcdefghijklmnopqrstuvwxyz', // Hashing salt
        store  : new SessionStore({
            dbname   : 'db',
            username : '',
            password : ''
        })
    }));
});

// Connect to the database
Mongoose.connect('mongodb://localhost/db');

// Main application
server.get('/', function(req, res) {

    token = req.session.id;
    
    //req.session.regenerate(function () {
        console.log('regenerated session id ' + req.session.id);
        token = req.session.id;
    //});
    
    res.render('index.jade', {
        locals : {
            port    : port,
            version : version,
            token   : token,
        }
    });
});

server.use('/upload', function(req, res, next) {
    console.log('upload!!!');
    var incomingForm = formidable.IncomingForm();
    incomingForm.on('fileBegin', function(field, file) {

        var tracker = {file: file, progress: [], ended: false};
        var push = setInterval(function() {
            publish('data', null, tracker);
        }, 2000)

        //publish('data', null, tracker);
        file
            .on('progress', function(recieved) {
                tracker.progress.push(recieved);
            })
            .on('end', function() {
                tracker.ended = true;
                publish('data', null, tracker);
                clearInterval(push);
            })
    })

    incomingForm.parse(req, function(err, fields, files) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received upload:\n\n');
        res.end(sys.inspect({fields: fields, files: files}));
    });
})

// Start application
server.listen(port);
DNode()
    .use(Auth)      // Authentication support
    .use(PubSub)    // Pub/sub channel support
    .use(CRUD)      // Backbone integration
    .use(Upload)    // File upload support
    .use(Gravatar)  // Gravatar integration
    .use(Misc)      // Misc. resources
    .listen(5050)
    .listen(server) // Start your engines!
