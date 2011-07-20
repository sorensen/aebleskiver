//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Clustered server
// ----------------

var Cluster  = require('cluster'),
    Live     = require('cluster-live'),
    Mongoose = require('mongoose');


// Start the cluster
Cluster('./app')
    .set('socket path', __dirname + '/socks')
    .use(Cluster.logger(__dirname + '/logs'))
    .use(Cluster.pidfiles(__dirname + '/pids'))
    .set('workers', 4)
    .in('development')
        .listen(8080)
        .use(Cluster.cli())
        .use(Cluster.repl(8000))
        .use(Cluster.debug())
        .use(Cluster.reload(['lib', 'vendor', 'app.js']))
        .use(Cluster.stats({ 
            connections   : true, 
            lightRequests : true 
        }))
        .use(Live({
            port : 8888,
            host : 'localhost',
            user : '',
            pass : ''
        }))
    .in('production')
        .listen(80);