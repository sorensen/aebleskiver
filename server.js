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