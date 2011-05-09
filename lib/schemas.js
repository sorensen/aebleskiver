// Mongoose ORM Schemas
// --------------------

// Exports for CommonJS
var Schemas;
if (typeof exports !== 'undefined') {
    bcrypt   = require('bcrypt');
    Mongoose = require('mongoose');
    Schema   = Mongoose.Schema;
    ObjectId = Schema.ObjectId;
    Schemas  = module.exports = {};
}

// Keyword extractor for searchability
function extractKeywords(text) {
  if (!text) return [];

  return text
    .split(/\s+/)
    .filter(function(v) { return v.length > 2; })
    .filter(function(v, i, a) { return a.lastIndexOf(v) === i; });
}

// Simple required field validator
function validatePresenceOf(value) {
    return value && value.length;
}

function encryptPassword(password) {
    // Sync
    return bcrypt.encrypt_sync(password, bcrypt.gen_salt_sync(10));
    
    // Async
    bcrypt.gen_salt(10, function(err, salt) { 
        bcrypt.encrypt(password, salt, function(err, hash) {
            return hash;
        }); 
    });
}
    
// Schema definitions
Schemas = {

    Message : new Schema({
        room     : { type : String, index : true },
        text     : String,
        username : String,
        avatar   : String,
        created  : { type : Date, default : Date.now },
        modified : { type : Date, default : Date.now }
    }),

    // Chat room schema
    Room : new Schema({
        name      : { type : String, index : { unique : true } },
        slug      : { type : String, index : { unique : true } },
        user_id   : ObjectId,
        tags      : Array,
        keywords  : [String],
        rank      : Number,
        upvotes   : { type : Number, default : 0 },
        downvotes : { type : Number, default : 0 },
        created   : { type : Date, default : Date.now },
        modified  : { type : Date, default : Date.now }
    }),

    // User schema
    User : new Schema({
        username         : { type : String, index : { unique : true }, validate: [validatePresenceOf, 'a username is required'] },
        email            : { type : String, index : { unique : true }, validate : [validatePresenceOf, 'an email is required'] },
        status           : { type : String, index : true },
        visits           : Number,
        displayName      : String,
        avatar           : String,
        crypted_password : String,
        created          : { type : Date, default : Date.now },
        modified         : { type : Date, default : Date.now }
    }),
    
    // Token used for session persistence.
    Token : new Schema({
        email  : { type : String, index : true },
        series : { type : String, index : true },
        token  : { type : String, index : true }
    }),
    
    // Application schema
    Application : new Schema({
        server  : { type : String, index : { unique : true } },
        visits  : Number
    })
};



Schemas.User
    .virtual('password')
    .set(function(password) {
        this._password = password;
        this.set('crypted_password', encryptPassword(password));
        
    })
    .get(function() { 
        return this._password; 
    });

Schemas.User
    .method('authenticate', function(password) {
    
        //Sync
        return bcrypt.compare_sync(password, this.crypted_password); // false
        return;
    
        // Async
        bcrypt.compare(password, this.crypted_password, function(err, result) {
            return result;
        });
    });

Schemas.User
    .pre('save', function(next) {
        if (!validatePresenceOf(this.password)) {
            next(new Error('Invalid password'));
        } 
        else {
            this.set('modified', new Date());
            next();
        }
    });

    

Schemas.Token
    .method('randomToken', function() {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    });

Schemas.Token
    .pre('save', function(next) {
        // Automatically create the tokens
        this.token = this.randomToken();

        if (this.isNew)
            this.series = this.randomToken();

        next();
    });

Schemas.Token
    .virtual('id')
    .get(function() {
        return this._id.toHexString();
    });

Schemas.Token
    .virtual('cookieValue')
    .get(function() {
        return JSON.stringify({ 
            email  : this.email, 
            token  : this.token, 
            series : this.series 
        });
    });
    
    
    
    
  
_.each(Schemas, function(model) {

    // Set a virtual 'id' field for each schema 
    // for Backbone integration
    model
        .virtual('id')
        .get(function() {
            return this._id.toHexString();
        });
});

Schemas.Room
    .pre('save', function(next) {
        this.set('modified', new Date());
        this.keywords = extractKeywords(this.name);
        next();
    });
    
Schemas.Room
    .path('name')
    .set(function(v){
            this.slug = v.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/-+/g, '');
            return v;
        });

// Set models to mongoose
Mongoose.model('user',        Schemas.User);
Mongoose.model('room',        Schemas.Room);
Mongoose.model('token',       Schemas.Token);
Mongoose.model('message',     Schemas.Message);
Mongoose.model('application', Schemas.Application);

