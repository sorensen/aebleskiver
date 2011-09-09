//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Clustered server
// ----------------

var Cluster  = require('cluster')
    Live     = require('cluster-live');

// Start the cluster
Cluster('./server')
    .set('workers', 4)
    .in('development')
        .set('socket path', __dirname + '/socks')
        .use(Cluster.logger(__dirname + '/logs'))
        .use(Cluster.pidfiles(__dirname + '/pids'))
        .use(Cluster.cli())
        .use(Cluster.repl(8000))
        .use(Cluster.debug())
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
        .listen(8080)
    .in('production')
        .listen(80);