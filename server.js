// Clustered server
// ----------------

var Cluster = require('cluster');

// Start the cluster
Cluster('./app')
    .use(Cluster.logger(__dirname + '/logs'))
    .use(Cluster.pidfiles(__dirname + '/pids'))
    .set('workers', 4)
    .listen(80);