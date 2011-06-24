//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Clustered server
// ----------------

var Cluster = require('cluster'),
    Live    = require('cluster-live');

Mongoose.connect('mongodb://localhost/aebleskiver');
    
// Start the cluster
Cluster('./app')
    .use(Cluster.logger(__dirname + '/logs'))
    .use(Cluster.pidfiles(__dirname + '/pids'))
    .set('workers', 4)
    .in('development')
        .listen(3000)
        .use(Cluster.cli())
        .use(Cluster.repl(8888))
        .use(Cluster.debug())
        .use(Cluster.stats({ 
            connections   : true, 
            lightRequests : true 
        }))
        .use(Live({
            user : 'admin',
            pass : 'aebleskiver'
        }))
    .in('production')
        .listen(80);