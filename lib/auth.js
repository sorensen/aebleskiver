(function(){
	// Express server authentication
    // -----------------------------
    
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
	Auth.authenticate = function(data, next) {
        if (!data.username || !data.password) return;
        
        var key = 'users:' + data.username;
        
        store.has(key, function(err, exists) {
            if (!exists) {
                // Uer could not be found
                next(new Error('No such user'));
            } else {
                // Check password
                store.get(key + '.password', function(err, val) {
                    val = buffered ? val.toString('utf8') : val;
                    
                    var hashed = Hash.sha1(data.password, salt + data.username);
                    if (hashed === val) {
                        // Retrieve public accessable data
                        store.get(key, function(err, val) {
                            val = buffered ? val.toString('utf8') : val;
                            return next(null, JSON.parse(val));
                        });
                    } else {
                        next(new Error('Invalid password'));
                    }
                });
            }
        });
	};
    
	// Register a new user
	Auth.register = function(data, next) {
        if (!data.username || !data.password || !data.email) return;
        
        var key = 'users:' + data.username;
        var model = {
            id       : data.username,
            name     : data.displayname || data.username,
            username : data.username,
            email    : data.email,
        };
        
        store.has(key, function(err, exists) {
            if (exists) {
                // User already exists
                next(new Error('Username taken'));
                return;
            }
            // Create user
            store.set(key, JSON.stringify(model), function() {
                // Save password
                var hashed = Hash.sha1(data.password, salt + data.username);
                store.set(key + '.password', hashed, function() {
                    return next(null, model);
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