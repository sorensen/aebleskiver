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
        
        var id = 'users:' + name;
        store.has(id, function(err, exists) {
            if (!exists) {
                // Uer could not be found
                //fn(new Error('No such user'));
                Auth.register(name, pass, fn);
            } else {
                // Check password
                store.get(id + '.password', function(err, val) {
                    val = buffered ? val.toString('utf8') : val;
                    var user = {
                        name : name
                    };
                    var hashed = Hash.sha1(pass, salt + name);
                    if (hashed === val) {
                        // Retrieve public accessable data
                        store.get(id, function(err, val) {
                            val = buffered ? val.toString('utf8') : val;
                            user.data = val;
                            return fn(null, user);
                        });
                    } else {
                        fn(new Error('Invalid password'));
                    }
                });
            }
        });
	};
    
	// Register a new user
	Auth.register = function(name, pass, fn) {
        if (!name || !pass) return;
        
        var id = 'users:' + name;
        store.has(id, function(err, exists) {
            if (exists) {
                // User already exists
                fn(new Error('Username taken'));
                return;
            }
            // Create user
            store.set(id, name, function() {
                // Save password
                var hashed = Hash.sha1(pass, salt + name);
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
	Auth.restricted = function(req, res, next) {
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