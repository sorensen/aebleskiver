(function(){
    // Client
    // ------------------
    require.paths.unshift(__dirname + '/lib');
    
    // Dependancies
    var dnode    = require('dnode'),
        Emitter  = require('events').EventEmitter
    
    // Remote protocol
    var Protocol = function() {
        // Created model            
        this.created = function(data, opt, cb) {
            console.log('created: ', data);
        };
        
        // Fetched model
        this.read = function(data, opt, cb) {
            console.log('read: ', data);
        };
        
        // Updated model data
        this.updated = function(data, opt, cb) {
            console.log('updated: ', data);
        };
        
        // Destroyed model
        this.destroyed = function(data, opt, cb) {
            console.log('destroyed: ', data);
        };
    };
    
    // Initialize DNode
    dnode(Protocol).connect(8080, function(remote) {
        var em = new Emitter;
        em.on('data', function (n) {
            //console.log('data:', n);
        });
        var emit = em.emit.bind(em);
        remote.subscribe(emit);
    });
})()