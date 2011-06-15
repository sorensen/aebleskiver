// Clustered server
// ----------------

var Cluster = require('cluster'),
    Live    = require('cluster-live');

// Start the cluster
Cluster('./app')
    .use(cluster.logger(__dirname + '/logs'))
    .use(cluster.pidfiles(__dirname + '/pids'))
    .set('workers', 4)
    .listen(80);