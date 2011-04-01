(function(){
	// Authentication helpers
    // ----------------------
    
	// Function helpers to make restricting routes and 
	// accessing session info easier
    var Auth;
    if (typeof exports !== 'undefined') {
		// Dependancies
        keys = require('keys');
        Auth = module.exports = {};
    } else {
        Auth = this.Auth = {};
    }
    
    // Storage container
    var store = new keys.Redis();
    
    // Check for buffered data
    var buffered = true;
    if (store instanceof keys.Redis) buffered = false;
    
	// Authenticate user with password
	Auth.authenticate = function(name, pass, fn) {
        if (!name || !pass) return;
        var hash = 'user:' + name;    
        store.has(hash, function(err, exists) {
            if (!exists) {
                // Uer could not be found
                fn(new Error('No such user'));
            } else {
                // Check password
                store.get(hash + '.password', function(err, val) {
                    val = buffered ? val.toString('utf8') : val;
                    var user = {
                        name : name,
                        data : val
                    };
                    if (pass === val) return fn(null, user);
                    fn(new Error('Invalid password'));
                });
            }
        });
	};
    
	// Register a new user
	Auth.register = function(name, pass, fn) {
        if (!name || !pass) return;
        var hash = 'user:' + name;
        store.has(hash, function(err, exists) {
            if (exists) {
                // User already exists
                fn(new Error('Username taken'));
                return;
            }
            // Create user
            store.set(hash, name, function() {
                // Save password
                store.set(hash + '.password', pass, function() {
                    var user = {
                        name : name,
                        data : {}
                    };
                    return fn(null, user);
                });
            });
        });
	};
	
	// Restrict access to route
	Auth.restrict = function(req, res, next) {
		if (req.session.user) {
            // User found, move along
			next();
		} else {
            // Force login
			req.session.error = 'Access denied';
			res.redirect('/login');
		}
	};
})()