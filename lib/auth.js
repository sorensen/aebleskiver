(function(){
    // TODO: Redo storage interface with 'Keys'

	// Authentication helpers
    // ----------------------
    
	// Function helpers to make restricting routes and 
	// accessing session info easier
    var Auth;
    if (typeof exports !== 'undefined') {
		// Dependancies
		redis = require('redis');
		rc = redis.createClient();
        
        
        Auth = module.exports = {};
    } else {
        Auth = this.Auth = {};
    }
    
	// Authenticate user against redis data
	Auth.authenticate = function(name, pass, fn) {
		console.log('Auth for ' + name + ' with password ' + pass);
		
		rc.get('user:' + name, function(err, data) {
            if (err) console.log("Redis Error: GET: " + err, err);
			if (!data) {
				// Add member to the collection set
				rc.sadd('users', name, function(err, data) {		
                    if (err) console.log("Redis Error: SADD: " + err, err);	
                    rc.set('user:' + name, name, function(err, data) {
                        rc.set('user:' + name + '.password', pass, function(err, data) {
                            if (err) console.log("Redis Error: SET: " + err, err);	
                            var user = {};
                            user.name = name;
                            user.data = data;
                            return fn(null, user);
                        });
                    });
				});
			} else {
				var user = {};
				user.name = data;
				rc.get('user:' + name + '.password', function(err, data) {
                    if (err) console.log("Redis Error: GET: " + err, err);
					if (pass == data) {
						user.pass = pass;
						user.data = data;
						return fn(null, user);
					}
					fn(new Error('invalid password'));
				});
			}
		});
	};
	
	// Restrict access to route
	Auth.restrict = function(req, res, next) {
		console.log('Restricted access');
		if (req.session.user) {
			next();
		} else {
			req.session.error = 'Access denied!';
			res.redirect('/login');
		}
	};
})()