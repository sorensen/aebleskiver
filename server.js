(function(){
    // Application Server
    // ------------------
    require.paths.unshift(__dirname + '/lib');
    
    // Dependancies
    var express  = require('express'),
        connect  = require('connect'),
        fugue    = require('fugue'),
        Store    = require('connect-redis');
        keys     = require('keys');
        Protocol = require('protocol'),
        _        = require('underscore')._,
        dnode    = require('dnode'),
        Auth     = require('auth'),
        REST     = require('rest'),
        server   = express.createServer();
    
    // Server configuration
    server.configure(function() {
        //server.use('/api', REST);
        server.use(express.logger());
        server.use(express.bodyParser());
        server.use(express.cookieParser());
        
        // Session storage
        server.use(express.session({ secret : "AEbleskivers", store : new Store() }));
        server.use(express.methodOverride());
        
        // Views settings
        server.use(express.static(__dirname + '/public'));
        server.set('view options', {layout: false});
    });
    
    // Public facing application
    server.get('/todos', function(req, res) {
        res.render('index.html'); return;
    });
    
    // Main application
    server.get('/', function(req, res) {
        res.render('main.jade', {
            locals: {
                //name: req.session.user.name,
                name: 'anonymous',
                //user: req.session.user.data
            }
        });
    });
    
     // Logout
    server.get('/logout', function(req, res) {
        // destroy the user's session to log them out
        // will be re-created next request
        req.session.destroy(function()
        {
            res.redirect('home');
        });
    });

    // Login
    server.get('/login', function(req, res) {
        if (req.session.user) {
            req.flash('success', 'Authenticated as ' + req.session.user.name
              + ' click to <a href="/logout">logout</a>. '
              + ' You may now access <a href="/restricted">/restricted</a>.');
        }
        res.render('login.jade');
    });

    // Login execution
    server.post('/login', function(req, res) {
        // Authenticate user
        Auth.authenticate(req.body.username, req.body.password, function(err, user) {
            if (user) {
                // Regenerate session when signing in
                // to prevent fixation 
                req.session.regenerate(function() {
                    req.session.user = user;
                    res.redirect('/main');
                });
            } else {
                req.flash('error', 'Authentication failed, please check your username and password.');
                res.redirect('back');
            }
        });
    });

    // Register
    server.get('/register', function(req, res) {
        if (req.session.user) {
            res.redirect('/main');
        }
        res.render('register.jade');
    });

    // Register execution
    server.post('/register', function(req, res) {
        // Authenticate user
        Auth.register(req.body.username, req.body.password, function(err, user) {
            if (user) {
                // Regenerate session when signing in
                // to prevent fixation 
                req.session.regenerate(function() {
                    req.session.user = user;
                    res.redirect('/main');
                });
            } else {
                req.flash('error', 'Registration failed, please check your username and password.');
                res.redirect('back');
            }
        });
    });

    // Start serving
    server.listen(8000);

    // Initialize DNode
    dnode(Protocol).listen(8080).listen(server);
})()
    