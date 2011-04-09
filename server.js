(function(){
    // Application Server
    // ------------------
    require.paths.unshift(__dirname + '/lib');
    
    // Dependancies
    var express  = require('express'),
        expose   = require('express-expose'),
        connect  = require('connect'),
        crypto   = require("crypto"),
        path     = require("path"),
        fs       = require("fs"),
        Store    = require('connect-redis'),
        GravatarProtocol = require('protocol-gravatar'),
        Protocol = require('protocol'),
        dnode    = require('dnode'),
        Auth     = require('auth'),
        Secure   = require('secure')(),
        server   = module.exports = express.createServer();
    
    // Server configuration
    server.configure(function() {
        server.use(express.logger());
        server.use(express.bodyParser());
        server.use(express.cookieParser());
        server.use(express.session({ secret : "AEbleskivers", store : new Store() }));
        server.use(express.methodOverride());
        server.use(express.static(__dirname + '/public'));
        server.set('view options', {layout: false});
        server.set('title', 'AEbleskivers');
        server.set('default language', 'en');
    });
    
    server.expose(server.settings);
    
    // Main application
    server.get('/', Auth.restricted, function(req, res) {
    
        if (req.session.user) server.expose(req.session.user, 'express.current.user');
    
        res.render('index.jade', {
        });
    });
    
     // Logout
    server.get('/logout', function(req, res) {
        // destroy the user's session to log them out
        // will be re-created next request
        req.session.destroy(function() {
            res.redirect('home');
        });
    });

    // Login
    server.get('/login', function(req, res) {
        res.render('login.jade');
    });

    // Login execution
    server.post('/login', function(req, res) {
        // Authenticate user
        Auth.authenticate(req.body, function(err, user) {
            if (user) {
                // Regenerate session when signing in
                // to prevent fixation 
                req.session.regenerate(function() {
                    req.session.user = user;
                    res.redirect('/');
                });
                
                server.expose(user, 'express.current.user');
            } else {
                res.redirect('back');
            }
        });
    });

    // Register
    server.get('/register', function(req, res) {
        if (req.session.user) {
            res.redirect('/');
        }
        res.render('register.jade');
    });

    // Register execution
    server.post('/register', function(req, res) {
        // Authenticate user
        Auth.register(req.body, function(err, user) {
            if (user) {
                // Regenerate session when signing in
                // to prevent fixation 
                req.session.regenerate(function() {
                    req.session.user = user;
                    res.redirect('/');
                });
                server.expose(user, 'express.current.user');
            } else {
                res.redirect('back');
            }
        });
    });
    
    // Start application
    server.listen(3000);
    
    // Enable DNode RPC
    dnode(Protocol)
        .use(GravatarProtocol)
        .listen(server)
})()