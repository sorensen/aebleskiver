(function(){
    // Application Server
    // ------------------
    require.paths.unshift(__dirname + '/lib');
    
    // Dependancies
    var express  = require('express'),
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
    
    // SSL Compatibility
    if (path.existsSync("keys/privatekey.pem")) {
        var privateKey  = fs.readFileSync("keys/privatekey.pem", "utf8");
        var certificate = fs.readFileSync("keys/certificate.pem", "utf8");
        var credentials = crypto.createCredentials({key: privateKey, cert: certificate});
    }
    
    // Server configuration
    server.configure(function() {
        credentials && server.setSecure(credentials);
        //Secure.http;
        server.use(express.logger());
        server.use(express.bodyParser());
        server.use(express.cookieParser());
        server.use(express.session({ secret : "AEbleskivers", store : new Store() }));
        //server.use(express.session({
        //    store : (new require("connect/middleware/session/memory"))({ 
        //        reapInterval: 60000 * 10 
        //    })
        //}));
        server.use(express.methodOverride());
        server.use(express.static(__dirname + '/public'));
        server.set('view options', {layout: false});
    });
    
    // Main application
    server.get('/', Auth.restricted, function(req, res) {
        res.render('main.jade', {
            locals: {
                //name: 'anonymous',
                name: req.session.user.username,
                user: req.session.user
            }
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
        Auth.authenticate(req.body, function(err, user) {
            if (user) {
                // Regenerate session when signing in
                // to prevent fixation 
                req.session.regenerate(function() {
                    req.session.user = user;
                    res.redirect('/');
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
            } else {
                req.flash('error', 'Registration failed, please check your username and password.');
                res.redirect('back');
            }
        });
    });
    // Start application
    server.listen(80);
    
    dnode(Protocol)
        .use(GravatarProtocol)
        .listen(server)
})()