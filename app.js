//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Application Server
// ------------------
require.paths.unshift(__dirname + '/lib');

// Dependencies
var express      = require('express'),
    SessionStore = require('connect-mongodb'),
    Mongoose     = require('mongoose');
    Misc         = require('backbone-misc'),
    PubSub       = require('backbone-pubsub'),
    CRUD         = require('backbone-crud'),
    Gravatar     = require('backbone-gravatar'),
    Auth         = require('backbone-auth'),
    DNode        = require('dnode'),
    version      = '0.3.2',
    port         = 3000,
    oneYear      = 31557600000,
    token        = '',
    app          = module.exports = express.createServer();

// Server configuration
app.configure(function() {
    // View settings
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.set('view engine', 'jade');
    app.set('view options', {layout : false});
    
    // Session settings
    app.use(express.session({
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
app.configure('development', function(){
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({
        // Make sure we can see our errors
        // and stack traces for debugging
        dumpExceptions : true, 
        showStack      : true 
    }));
});

// Production specific configurations
app.configure('production', function() {
    port = 80;
    app.use(express.static(__dirname + '/public', {
        // Set the caching lifetime
        maxAge: oneYear 
    }));
    app.use(express.errorHandler());
});

// Connect to the database
Mongoose.connect('mongodb://localhost/aebleskiver');

// Main application
app.get('/', function(req, res) {
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

// Start application if not clustered
if (!module.parent) {
    app.listen(port);
}

// Configure DNode socket abstraction
DNode()
    .use(Auth)      // Authentication support
    .use(PubSub)    // Pub/sub channel support
    .use(CRUD)      // Backbone integration
    .use(Gravatar)  // Gravatar integration
    .use(Misc)      // Misc. resources
    .listen(app) // Start your engines!
