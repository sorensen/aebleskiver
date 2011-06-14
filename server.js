// Clustered server
// ----------------

var cluster = require('cluster');
    //live    = require('cluster-live');

// Start the cluster
cluster('./app')
    .use(cluster.logger(__dirname + '/logs'))
    .use(cluster.pidfiles(__dirname + '/pids'))
    .set('workers', 4)
    /**
    .in('development')
        .use(cluster.cli())
        .use(cluster.repl(8000))
        .use(cluster.debug())
        .use(cluster.stats({ 
            connections   : true, 
            lightRequests : true 
        }))
        .use(live({
            user : 'beau',
            pass : 'sorensen'
        }))
    **/
    .listen(80);