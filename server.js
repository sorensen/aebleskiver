//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Application Server
// ------------------
require.paths.unshift(__dirname + '/lib');

// Project dependencies
var express      = require('express'),
    SessionStore = require('connect-mongodb'),
    Mongoose     = require('mongoose'),
    Redis        = require('redis'),
    Schemas      = require('schemas'),
    middleware   = require('backbone-dnode'),
    DNode        = require('dnode'),
    browserify   = require('browserify'),
    app          = module.exports = express.createServer();
    
middleware.avatar = require('backbone-avatar');
middleware.misc   = require('backbone-misc');
middleware.auth   = require('backbone-auth');

// Configuration settings
var cookieAge    = 60000 * 60 * 1,
    cacheAge     = 60000 * 60 * 24 * 365,
    secret       = 'abcdefghijklmnopqrstuvwxyz',
    token        = '',
    port         = 3000,
    production   = 80,
    staticViews  = __dirname + '/public',
    dbpath       = 'mongodb://localhost/aebleskiver',
    version      = '0.3.2',
    redisConfig  = {
        port     : 6379,
        host     : '127.0.0.1',
        options  : {
            parser        : 'javascript',
            return_buffer : false
        },
    };

// Create the publish and subscribe clients for redis to 
// send to the DNode pubsub middleware
var pub = Redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options),
    sub = Redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options)

// Configure our browserified bundles, seperating them out to 
// related packages for ease of development and debugging
var core = browserify({
        require : [
            'underscore',
            'backbone',
            'dnode',
            'backbone-dnode'
        ],
        entry : [
            /**
            __dirname + '/public/js/models/message.model.js',
            __dirname + '/public/js/models/room.model.js',
            __dirname + '/public/js/models/user.model.js',
            __dirname + '/public/js/models/app.model.js',
            
            __dirname + '/public/js/views/message.view.js',
            __dirname + '/public/js/views/room.view.js',
            __dirname + '/public/js/views/user.view.js',
            __dirname + '/public/js/views/app.view.js',
            __dirname + '/public/js/views/footer.view.js',
            __dirname + '/public/js/views/nav.view.js',
            __dirname + '/public/js/views/sidebar.view.js',
            __dirname + '/public/js/views/notification.view.js',

            __dirname + '/public/js/routers/app.router.js',

            __dirname + '/public/js/rpc/auth.dnode.js',
            __dirname + '/public/js/rpc/avatar.dnode.js',
            __dirname + '/public/js/rpc/misc.dnode.js',
            
            __dirname + '/public/js/google.js',
            __dirname + '/public/js/helpers.js',
            __dirname + '/public/js/icons.js',
            __dirname + '/public/js/init.js'
            **/
        ],
        mount   : '/core.js'
    });

// Create the mongo session store for express and 
// authentication middleware
var session = new SessionStore({
    dbname   : dbpath,
    username : '',
    password : ''
});

// Server configuration, set the server view settings to 
// render in jade, set the session middleware and attatch 
// the browserified bundles to the app on the client side.
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.set('view engine', 'jade');
    app.use(express.session({
        cookie : {maxAge : cookieAge},
        secret : secret,
        store  : session
    }));
    app.use(core);
});

// Development specific configurations, make sure we can 
// see our errors and stack traces for debugging
app.configure('development', function(){
    app.use(express.static(staticViews));
    app.use(express.errorHandler({
        dumpExceptions : true, 
        showStack      : true 
    }));
});

// Production specific configurations, set the caching life
// for all public served files, change the port to production, 
// (joyent uses port 80), and add the error handlers.
app.configure('production', function() {
    port = production;
    app.use(express.static(staticViews, {
        maxAge: cacheAge
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

// Start up the application and connect to the mongo 
// database if not part of another module or clustered, 
// configure the Mongoose model schemas, setting them to 
// our database instance. The DNode middleware will need 
// to be configured with the database references.
if (!module.parent) {
    Schemas.defineModels(Mongoose, function() {
        database = Mongoose.connect(dbpath);
        middleware.crud.config(database);
        middleware.pubsub.config(pub, sub);
        middleware.auth.config(database, session);
    });
    app.listen(port);
}

// Attatch the DNode middleware and connect
DNode()
    .use(middleware.pubsub) // Pub/sub channel support
    .use(middleware.crud)   // Backbone integration
    .use(middleware.avatar) // Gravatar integration
    .use(middleware.auth)   // Authentication support
    .use(middleware.misc)   // Misc. resources
    .listen(app)            // Start your engines!
