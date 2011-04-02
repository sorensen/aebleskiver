/**
 * Module dependencies.
 */
var express  = require('express'),
    messages = require('express-messages'),
    server   = module.exports = express.createServer();

// mount hook
server.mounted(function(other){
    console.log('REST interface mounted.');
});

// Flash message helper provided by express-messages
// $ npm install express-messages
server.dynamicHelpers({
    messages: messages,
    base: function(){
        // return the app's mount-point
        // so that urls can adjust. For example
        // if you run this example /post/add works
        // however if you run the mounting example
        // it adjusts to /blog/post/add
        return '/' == server.route ? '' : server.route;
    }
});

// Middleware
server.configure(function(){
    server.use(express.logger('\x1b[33m:method\x1b[0m \x1b[32m:url\x1b[0m :response-time'));
    server.use(express.bodyParser());
    server.use(express.methodOverride());
    server.use(express.cookieParser());
    server.use(express.session({ secret: 'keyboard cat' }));
    server.use(server.router);
    server.use(express.static(__dirname + '/../public'));
    server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//------------------------------------------------------------------------------
//                                      READ
//------------------------------------------------------------------------------
server.get('/items', function(req, res) {
    debug('---- GET /items');
    
    serverSideCollection.fetch({
        success:function(data){
            res.writeHead(200)
            res.end(JSON.stringify(data))
        }, 
        error:function(err){
            res.writeHead(204)
            res.end(err)
        }
    });
})
server.get('/items/:id', function(req, res) {
    debug('---- GET /items/:id');
    
    var model = serverSideCollection.get(req.params.id);
    if (model) {
        res.writeHead(200)
        res.end(JSON.stringify(model))
    } else {
        res.writeHead(404)
        res.end('Record not found')
    }
})
//------------------------------------------------------------------------------
//                                      CREATE
//------------------------------------------------------------------------------
server.post('/items', function(req, res) {
    debug('---- POST /items');
    
    serverSideCollection.create(req.body,{
        success:function(data){
            res.writeHead(200)
            res.end(JSON.stringify(data))  
        },
        error:function(err){
            res.writeHead(404)
            res.end(err)
        }
    });
})
//------------------------------------------------------------------------------
//                                      UPDATE
//------------------------------------------------------------------------------
server.put('/items/:id', function(req, res) {
    debug('---- PUT /items/:id');
    req.body.id = req.params.id;
    
    serverSideCollection.get(req.params.id).set(req.body).save({
        success:function(data){
            res.writeHead(200)
            res.end(JSON.stringify(data))
        },
        error:function(err){
            res.writeHead(404)
            res.end(err)
        }
    });
})
//------------------------------------------------------------------------------
//                                      DELETE
//------------------------------------------------------------------------------
server.del('/items/:id', function(req, res) {
    debug('---- DEL /items/:id');
    
    res.end(JSON.stringify(serverSideCollection.get(req.params.id).destroy({
        success:function(data){
            res.writeHead(200)
            res.end(JSON.stringify(data))  
        },
        error:function(err){
            res.writeHead(404)
            res.end(err)
        }
    })));
})