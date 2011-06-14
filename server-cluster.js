// Clustered server
// ----------------

var cluster = require('cluster'),
    live    = require('cluster-live');

cluster('./server')
    .use(cluster.logger(__dirname + '/logs'))
    .use(cluster.pidfiles(__dirname + '/pids'))
    .use(cluster.cli())
    .use(cluster.repl(8000))
    .set('workers', 4)
    .use(cluster.debug())
    .use(cluster.stats({ 
        connections   : true, 
        lightRequests : true 
    }))
    .use(live())
    .in('development')
        .listen(8080)
    .in('production')
        .listen(80);