// Application Server
// ------------------
require.paths.unshift(__dirname + '/lib');

// Dependencies
var express      = require('express'),
    SessionStore = require('connect-mongodb'),
    Mongoose     = require('mongoose');
    Misc         = require('protocol-misc'),
    PubSub       = require('protocol-pubsub'),
    CRUD         = require('protocol-crud'),
    Gravatar     = require('protocol-gravatar'),
    Auth         = require('protocol-auth'),
    DNode        = require('dnode'),
    version      = '0.3.2',
    port         = 80,
    token        = '',
    server       = module.exports = express.createServer();

// Server configuration
server.configure(function() {
    // View settings
    server.use(express.bodyParser());
    server.use(express.cookieParser());
    server.use(express.methodOverride());
    server.set('view engine', 'jade');
    server.set('view options', {layout : false});
    
    // Session settings
    server.use(express.session({
        cookie : {maxAge : 60000 * 60 * 1},    // 1 Hour
        secret : 'abcdefghijklmnopqrstuvwxyz', // Hashing salt
        store  : new SessionStore({
            dbname   : 'db',
            username : '',
            password : ''
        })
    }));
});
    
// Development specific configurations
server.configure('development', function(){
    server.use(express.static(__dirname + '/public'));
    server.use(express.errorHandler({
        // Make sure we can see our errors
        // and stack traces for debugging
        dumpExceptions : true, 
        showStack      : true 
    }));
});

// Production specific configurations
server.configure('production', function(){
    server.use(express.static(__dirname + '/public', {
        // Set the caching lifetime
        maxAge: oneYear 
    }));
    server.use(express.errorHandler());
});

// Connect to the database
Mongoose.connect('mongodb://localhost/db');

// Main application
server.get('/', function(req, res) {

    token = req.session.id;
    
    //req.session.regenerate(function () {
        //token = req.session.id;
    //});
    
    res.render('index.jade', {
        locals : {
            port    : port,
            version : version,
            token   : token,
        }
    });
});

// Start application
server.listen(port);
DNode()
    .use(Auth)      // Authentication support
    .use(PubSub)    // Pub/sub channel support
    .use(CRUD)      // Backbone integration
    .use(Gravatar)  // Gravatar integration
    .use(Misc)      // Misc. resources
    .listen(server) // Start your engines!
