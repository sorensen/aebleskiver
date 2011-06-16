// Clustered server
// ----------------

var Cluster = require('cluster'),
    Live    = require('cluster-live');

// Start the cluster
Cluster('./app')
    .use(Cluster.logger(__dirname + '/logs'))
    .use(Cluster.pidfiles(__dirname + '/pids'))
    .set('workers', 4)
    .in('development')
        .listen(8080)
        .use(Cluster.cli())
        .use(Cluster.repl(8000))
        .use(Cluster.debug())
        .use(Cluster.stats({ 
            connections   : true, 
            lightRequests : true 
        }))
        .use(Live({
            user : 'beau',
            pass : 'sorensen'
        }))
    .in('production')
        .listen(80);