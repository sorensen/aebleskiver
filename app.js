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
    Auth         = require('backbone-auth'),
    
    PubSub       = require('backbone-dnode').pubsub,
    CRUD         = require('backbone-dnode').crud,
    Avatar       = require('backbone-dnode').avatar,
    
    DNode        = require('dnode'),
    version      = '0.3.2',
    port         = 8080,
    secret       = 'abcdefghijklmnopqrstuvwxyz',
    token        = '',
    database     = 'aebleskiver',
    app          = express.createServer();

// Server configuration
app.configure(function() {
    // View settings
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(connect.logger());         // Log responses to the terminal using Common Log Format.
    app.use(connect.responseTime());   // Add a special header with timing information.
    app.use(connect.conditionalGet()); // Add HTTP 304 responses to save even more bandwidth.
    app.use(connect.cache());          // Add a short-term ram-cache to improve performance.
    app.use(connect.gzip());           // Gzip the output stream when the browser wants it.
    app.set('view engine', 'jade');
    app.set('view options', {layout : false});
    
    // Session settings
    app.use(express.session({
        cookie : {maxAge : 60000 * 60 * 1},
        secret : secret,
        store  : new SessionStore({
            dbname   : database,
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
        // Set the caching lifetime to one year
        maxAge: 60000 * 60 *  24 * 365
    }));
    app.use(express.errorHandler());
});

// Main application
app.get('/', function(req, res) {
    req.session.regenerate(function () {
        token = req.session.id;
        
        res.render('index.jade', {
            locals : {
                port    : port,
                version : version,
                token   : token,
            }
        });
    });
});

// Start application if not clustered
if (!module.parent) {
    // Connect to the database
    Mongoose.connect('mongodb://localhost/' + database);
    app.listen(port);
}

// Configure DNode middleware
DNode()
    .use(Auth)      // Authentication support
    .use(PubSub)    // Pub/sub channel support
    .use(CRUD)      // Backbone integration
    .use(Avatar)    // Gravatar integration
    .use(Misc)      // Misc. resources
    .listen(app)    // Start your engines!

module.exports = app;