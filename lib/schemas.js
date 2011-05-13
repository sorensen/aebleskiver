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

// Keyword extractor for mongo searchability
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

// Password encryption mechanics
function encryptPassword(password) {
    // Synchronous processing
    return bcrypt.encrypt_sync(password, bcrypt.gen_salt_sync(10));
    
    // Async processing
    bcrypt.gen_salt(10, function(err, salt) { 
        bcrypt.encrypt(password, salt, function(err, hash) {
            return hash;
        }); 
    });
}
    
// Basic schema definitions initialized here, schema 
// methods and custom getters/setters that interact with 
// other schemas / models will need them to be defined first
Schemas = {

    // Basic chat message
    Message : new Schema({
        room     : { type : String, index : true },
        text     : String,
        username : String,
        user_id  : ObjectId,
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

    // User
    User : new Schema({
        username         : { type : String, index : { unique : true } },
        email            : { type : String, index : { unique : true } },
        status           : { type : String, index : true },
        visits           : Number,
        displayName      : String,
        bio              : String,
        avatar           : String,
        crypted_password : String,
        created          : { type : Date, default : Date.now },
        modified         : { type : Date, default : Date.now }
    }),
    
    // Application schema, not currently used, but can be set 
    // in the future for DB configurables / simple analytics, 
    // there should probably never be more than one
    Application : new Schema({
        server  : { type : String, index : { unique : true } },
        visits  : Number
    }),
    
    // Session defined to match connect-mongodb package sessions, 
    // to allow tighter integration between Express / Mongoose, 
    // which will ultimately trickle down to Backbone ease-of-use
    Session : new Schema({
        _id     : String,
        session : { type : String, get : function() {
            return JSON.parse(this.session);
        }},
        expires : Number
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

Schemas.Room
    .pre('save', function(next) {
        this.set('modified', new Date());
        this.keywords = extractKeywords(this.name);
        next();
    });
    
Schemas.Room
    .path('name')
    .set(function(v){
        this.slug = v
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/-+/g, '');
            
        return v;
    });

// Set models to mongoose
Mongoose.model('user',        Schemas.User);
Mongoose.model('room',        Schemas.Room);
Mongoose.model('message',     Schemas.Message);
Mongoose.model('session',     Schemas.Session);
Mongoose.model('application', Schemas.Application);

