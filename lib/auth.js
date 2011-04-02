(function(){
	// Authentication helpers
    // ----------------------
    
	// Function helpers to make restricting routes and 
	// accessing session info easier
    var Auth;
    if (typeof exports !== 'undefined') {
		// Dependancies
        Keys = require('keys');
        Auth = module.exports = {};
        Hash = require('./hash');
    } else {
        Auth = this.Auth = {};
    }

    // Hashing salt
    salt = "aebleskiver";
    
    // Storage container
    var store = new Keys.Redis();
    
    // Check for buffered data
    var buffered = true;
    if (store instanceof Keys.Redis) buffered = false;
    
	// Authenticate user with password
	Auth.authenticate = function(name, pass, fn) {
        if (!name || !pass) return;
        
        // Hash the key as an extra precaution
        var id = Hash.sha1('user:' + name, salt + name);
        store.has(id, function(err, exists) {
            if (!exists) {
                // Uer could not be found
                fn(new Error('No such user'));
            } else {
                // Check password
                store.get(id + '.password', function(err, val) {
                    val = buffered ? val.toString('utf8') : val;
                    var user = {
                        name : name,
                        data : val
                    };
                    var hashed = Hash.sha1(pass, salt + name);
                    if (hashed === val) return fn(null, user);
                    fn(new Error('Invalid password'));
                });
            }
        });
	};
    
	// Register a new user
	Auth.register = function(name, pass, fn) {
        if (!name || !pass) return;
        
        // Hash the key as an extra precaution
        var id = Hash.sha1('user:' + name, salt + name);
        store.has(id, function(err, exists) {
            if (exists) {
                // User already exists
                fn(new Error('Username taken'));
                return;
            }
            // Create user
            store.set(id, name, function() {
                // Save password
                var hashed = Hash.sha1(pass, salt + name)
                store.set(id + '.password', hashed, function() {
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
			req.flash('error', 'Access denied');
			res.redirect('/login');
		}
	};
})()