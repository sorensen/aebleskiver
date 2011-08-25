//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Application Server
// ==================

require.paths.unshift(__dirname + '/lib');

// Dependencies
// ------------

// Include all project dependencies
var express      = require('express'),
    Mongo        = require('mongodb'),
    SessionStore = require('connect-mongodb'),
    Mongoose     = require('mongoose'),
    Redis        = require('redis'),
    Schemas      = require('schemas'),
    middleware   = require('backbone-dnode'),
    avatar       = require('rpc/backbone-avatar'),
    misc         = require('rpc/backbone-misc'),
    auth         = require('rpc/backbone-auth'),
    DNode        = require('dnode'),
    browserify   = require('browserify'),
    app          = module.exports = express.createServer();

// Configuration
// -------------

// Settings
var cookieAge    = 60000 * 60 * 1,
    cacheAge     = 60000 * 60 * 24 * 365,
    secret       = 'abcdefghijklmnopqrstuvwxyz',
    token        = '',
    port         = 8080,
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
    },
    sessionConfig = {
        username : '',
        password : ''
    };

// Establish a direct connection with MongoDB for the 
// connect-mongodb session store
var mongoConfig = new Mongo.Server('localhost', 27017, {
        auto_reconnect : true,
        native_parser  : true
    }),
    mongoDb = new Mongo.Db('aelbeskiver', mongoConfig, {}),
    session = new SessionStore({db : mongoDb});

// Configure our browserified bundles, seperating them out to 
// related packages for ease of development and debugging
var core = browserify({
    ignore : [
        'underscore',
        'backbone',
    ],
    require : [
        'dnode',
        'backbone-dnode'
    ],
    entry : [
        // Models
        __dirname + '/lib/models/message.model.js',
        __dirname + '/lib/models/user.model.js',
        __dirname + '/lib/models/app.model.js',
        __dirname + '/lib/models/room.model.js',
        
        // Views
        __dirname + '/lib/views/message.view.js',
        __dirname + '/lib/views/room.view.js',
        __dirname + '/lib/views/user.view.js',
        __dirname + '/lib/views/app.view.js',
        __dirname + '/lib/views/footer.view.js',
        
        // Routers
        __dirname + '/lib/routers/app.router.js',

        // DNode middleware
        __dirname + '/lib/rpc/browser/auth.dnode.js',
        __dirname + '/lib/rpc/browser/avatar.dnode.js',
        __dirname + '/lib/rpc/browser/misc.dnode.js',
        
        // General
        __dirname + '/public/js/google.js',
        __dirname + '/public/js/helpers.js',
        __dirname + '/public/js/icons.js',
        __dirname + '/public/js/init.js'
    ],
    mount  : '/core.js'
    //filter : require('uglify-js')
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
});

// Development specific configurations, make sure we can 
// see our errors and stack traces for debugging
app.configure('development', function(){
    app.use(express.static(staticViews));
    app.use(express.errorHandler({
        dumpExceptions : true, 
        showStack      : true 
    }));

    app.use(core);
});

// Production specific configurations, set the caching life
// for all public served files, change the port to production, 
// (joyent uses port 80), and add the error handlers.
app.configure('production', function() {
    port = production;
    app.use(express.static(staticViews, {maxAge: cacheAge}));
    app.use(express.static(__dirname + '/lib/compiled',        {maxAge: cacheAge}));
    app.use(express.errorHandler());
});

// Create the publish and subscribe clients for redis to 
// send to the DNode pubsub middleware
var pub = Redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options),
    sub = Redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options),
    rdb = Redis.createClient(redisConfig.port, redisConfig.host, redisConfig.options);


// Start up the application and connect to the mongo 
// database if not part of another module or clustered, 
// configure the Mongoose model schemas, setting them to 
// our database instance. The DNode middleware will need 
// to be configured with the database references.
Schemas.defineModels(Mongoose, function() {
    database = Mongoose.connect(dbpath);
    middleware.crud.config(database);
    middleware.pubsub.config({
        publish   : pub,
        subscribe : sub,
        database  : rdb
    });
    auth.config(database, session);
});

// Routes
// ------

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

if (!module.parent) {
    app.listen(port);
}

// Initialize
// ----------

// Attatch the DNode middleware and connect
DNode()
    .use(middleware.pubsub) // Pub/sub channel support
    .use(middleware.crud)   // Backbone integration
    .use(avatar)            // Gravatar integration
    .use(auth)              // Authentication support
    .use(misc)              // Misc. resources
    .listen(app)            // Start your engines!
