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
    Mongoose     = require('mongoose'),
    Redis        = require('redis'),
    Schemas      = require('schemas'),
    Misc         = require('backbone-misc'),
    Auth         = require('backbone-auth'),
    middleware   = require('backbone-dnode'),
    
    crud = require('backbone-crud'),
    pubsub = require('backbone-pubsub'),
    avatar = require('backbone-avatar'),
    
    DNode        = require('dnode'),
    browserify   = require('browserify'),
    cookieAge    = 60000 * 60 * 1,
    cacheAge     = 60000 * 60 * 24 * 365,
    secret       = 'abcdefghijklmnopqrstuvwxyz',
    token        = '',
    port         = 3000,
    production   = 80,
    database     = 'mongodb://localhost/aebleskiver',
    redisConfig  = {
        port     : 6379,
        host     : '127.0.0.1',
        options  : {
            parser        : 'javascript',
            return_buffer : false
        },
    },
    staticViews  = __dirname + '/public',
    bundle       = browserify({
        require : [
            'backbone-dnode',
            __dirname + '/public/js/rpc/auth.dnode.js',
            __dirname + '/public/js/rpc/misc.dnode.js',
        ],
        mount   : '/bundle.js',
    }),
    models = browserify({
        require : [
            __dirname + '/public/js/models/message.model.js',
            __dirname + '/public/js/models/room.model.js',
            __dirname + '/public/js/models/user.model.js',
            __dirname + '/public/js/models/app.model.js'
        ],
        mount   : '/models.js',
    }),
    views = browserify({
        require : [
            __dirname + '/public/js/views/message.view.js',
            __dirname + '/public/js/views/room.view.js',
            __dirname + '/public/js/views/user.view.js',
            __dirname + '/public/js/views/app.view.js'
        ],
        mount   : '/views.js',
    }),
    routers = browserify({
        require : [
            __dirname + '/public/js/routers/app.router.js'
        ],
        mount   : '/routers.js',
    }),
    version = '0.3.2',
    app = module.exports = express.createServer();

// Server configuration
app.configure(function() {
    // View settings
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.set('view engine', 'jade');
    
    // Session settings
    app.use(express.session({
        cookie : {maxAge : cookieAge},
        secret : secret,
        store  : new SessionStore({
            dbname   : database,
            username : '',
            password : ''
        })
    }));
    
    // Make the backbone-dnode client side available for 
    // the browser using browserify
    app.use(bundle);
    app.use(models);
    app.use(views);
    app.use(routers);
});
    
// Development specific configurations
app.configure('development', function(){
    app.use(express.static(staticViews));
    //app.use(express.logger());
    app.use(express.errorHandler({
        // Make sure we can see our errors
        // and stack traces for debugging
        dumpExceptions : true, 
        showStack      : true 
    }));
});

// Production specific configurations
app.configure('production', function() {
    port = production;
    app.use(express.static(staticViews, {
        // Set the caching lifetime to one year
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
// database if not part of another module or clustered
if (!module.parent) {
    // Set models to mongoose
    Schemas.defineModels(Mongoose, function() {
        app.User         = Mongoose.model('user');
        app.Room         = Mongoose.model('room');
        app.User         = Mongoose.model('token');
        app.Token        = Mongoose.model('message');
        app.Session      = Mongoose.model('session');
        app.Application  = Mongoose.model('application');
        app.Conversation = Mongoose.model('conversation');
        
        db = Mongoose.connect(database);
        crud.config(db, function() {
            // Placeholder
        });
    });
    
    // Configure the pubsub middleware
    pubsub.config(Redis, {
        port     : redisConfig.port,
        host     : redisConfig.host,
        options  : redisConfig.options,
        password : redisConfig.password,
        authcb   : function(){}
    }, function() {
        // Placeholder
    });
    
    // Start the application
    app.listen(port);
}

// Configure DNode middleware
DNode()
    .use(pubsub)    // Pub/sub channel support
    .use(crud)      // Backbone integration
    .use(avatar)    // Gravatar integration
    .use(Auth)                 // Authentication support
    .use(Misc)                 // Misc. resources
    .listen(app)               // Start your engines!
