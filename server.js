(function(){
    // Application Server
    // ------------------
    var express  = require('express'),
        connect  = require('connect'),
        //fugue    = require('fugue'),
        Protocol = require('./lib/protocol'),
        _        = require('underscore')._,
        dnode    = require('dnode'),
        server   = express.createServer();
    
    // Server configuration
    server.configure(function() {
        server.use(express.logger());
        server.use(express.bodyParser())
        server.use(express.methodOverride())
        server.use(express.static(__dirname + '/public'));
        server.set('view options', {layout: false});
    });
    
    // Initialize DNode
    dnode(Protocol).listen(server);
    
    // Main application
    server.get('/', function(req, res) {
        res.render('index'); return;
    });
    
    // Todos application
    server.get('/main', function(req, res) {
        res.render('main.jade', {
            locals: {
                name: 'anonymous',
                user: 'User'
            }
        });
    });

    // Start serving
    server.listen(8080);
})()
    