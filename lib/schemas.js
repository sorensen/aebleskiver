//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Mongoose ORM Schemas
// --------------------

// Save a reference to the global object.
var root = this,
    MessageSchema,
    RoomSchema,
    ConversationSchema,
    UserSchema,
    TokenSchema,
    SessionSchema,
    ApplicationSchema;

// Require Underscore, if we're on the server, and it's not already present.
var _ = root._;
if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;

// Exports for CommonJS
if (typeof exports !== 'undefined') {
    var bcrypt = require('bcrypt'),
        mongooseAuth = require('mongoose-auth')
}

//###extractKeywords
// Keyword extractor for mongo searchability
function extractKeywords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(function(v) { return v.length > 2; })
    .filter(function(v, i, a) { return a.lastIndexOf(v) === i; });
}

//###validatePresenceOf
// Simple required field validator
function validatePresenceOf(value) {
    return value && value.length;
}

//###encryptPassword
// Asynchronous bcrypt password protection
function encryptPassword(password) {
    return bcrypt.encrypt_sync(password, bcrypt.gen_salt_sync(10));
}

//##defineModels
// Basic schema definitions initialized here, schema 
// methods and custom getters/setters that interact with 
// other schemas / models will need them to be defined first
function defineModels(mongoose, next) {
    var Schema   = mongoose.Schema,
        ObjectId = Schema.ObjectId;
    
    //###Message
    // Basic chat message
    MessageSchema = new Schema({
        room     : { type : String, index : true },
        text     : String,
        username : String,
        to       : String,
        user_id  : String,
        avatar   : String,
        created  : { type : Date, default : Date.now },
        modified : { type : Date, default : Date.now }
    });

    //###Room
    // Chat room schema
    RoomSchema = new Schema({
        name        : { type : String, index : { unique : true } },
        slug        : { type : String, index : { unique : true } },
        user_id     : String,
        tags        : Array,
        keywords    : [String],
        description : String,
        rank        : Number,
        restricted  : String,
        allowed     : Array,
        banned      : Array,
        upvotes     : { type : Number, default : 0 },
        downvotes   : { type : Number, default : 0 },
        created     : { type : Date, default : Date.now },
        modified    : { type : Date, default : Date.now }
    });
    
    RoomSchema
        .pre('save', function(next) {
            this.set('modified', new Date());
            var keywords  = extractKeywords(this.name),
                descwords = extractKeywords(this.description),
                concat    = keywords.concat(descwords);
            this.keywords = _.unique(concat);
            next();
        });
        
    RoomSchema
        .path('name')
        .set(function(v){
            this.slug = v
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')
                .replace(/-+/g, '');
            return v;
        });
    
    //###Conversation
    // Chat room schema
    ConversationSchema = new Schema({
        user_id     : ObjectId,
        users       : Array,
        created     : { type : Date, default : Date.now },
        modified    : { type : Date, default : Date.now }
    });

    //###User
    // User
    UserSchema = new Schema({
        username         : { type : String, index : { unique : true } },
        email            : { type : String, index : { unique : true } },
        status           : { type : String, index : true },
        visits           : Number,
        displayName      : String,
        bio              : String,
        avatar           : String,
        crypted_password : String,
        profile_image    : String,
        images           : Array,
        friends          : Array,
        blocked          : Array,
        restricted       : String,
        favorites        : Array,
        created          : { type : Date, default : Date.now },
        modified         : { type : Date, default : Date.now }
    });

    UserSchema
        .virtual('password')
        .set(function(password) {
            this._password = password;
            this.set('crypted_password', encryptPassword(password));
        })
        .get(function() { 
            return this._password; 
        });

    UserSchema
        .method('authenticate', function(password) {
            return bcrypt.compare_sync(password, this.crypted_password);
            bcrypt.compare(password, this.crypted_password, function(err, result) {
                return result;
            });
        });

    UserSchema
        .pre('save', function(next) {
            if (!validatePresenceOf(this.password)) {
                next(new Error('Invalid password'));
            } else {
                this.set('modified', new Date());
                next();
            }
        });
    /**
    UserSchema.plugin(mongooseAuth, {
        // Here, we attach your User model to every module
        everymodule: {
          everyauth: {
              User: function () {
                return User;
              }
          }
        }
      , password: {
            everyauth: {
                getLoginPath: '/login'
              , postLoginPath: '/login'
              , loginView: 'login.jade'
              , getRegisterPath: '/register'
              , postRegisterPath: '/register'
              , registerView: 'register.jade'
              , loginSuccessRedirect: '/'
              , registerSuccessRedirect: '/'
            }
        }
    });
    **/
    
    //###Application
    // Application schema, not currently used, but can be set 
    // in the future for DB configurables / simple analytics, 
    // there should probably never be more than one
    ApplicationSchema = new Schema({
        server  : { type : String, index : { unique : true } },
        visits  : Number
    });
    
    //###Session
    // Session defined to match connect-mongodb package sessions, 
    // to allow tighter integration between Express / Mongoose, 
    // which will ultimately trickle down to Backbone ease-of-use
    SessionSchema = new Schema({
        _id     : String,
        session : { type : String, get : function() {
            return JSON.parse(this.session);
        }},
        expires : Number
    });
    
    //###Token
    // Login tokens for session persistance
    TokenSchema = new Schema({
        email  : { type: String, index: true },
        series : { type: String, index: true },
        token  : { type: String, index: true }
    });

    TokenSchema
        .method('randomToken', function() {
            return Math.round((new Date().valueOf() * Math.random())) + '';
        });

    TokenSchema
        .pre('save', function(next) {
            this.token = this.randomToken();
            if (this.isNew)
            this.series = this.randomToken();
            next();
        });

    TokenSchema
        .virtual('id')
        .get(function() {
            return this._id.toHexString();
        });

    TokenSchema
        .virtual('cookieValue')
        .get(function() {
            return JSON.stringify({ 
                email  : this.email, 
                token  : this.token, 
                series : this.series 
            });
        });

    // Set models to mongoose
    mongoose.model('user', UserSchema);
    mongoose.model('room', RoomSchema);
    mongoose.model('token', TokenSchema);
    mongoose.model('message', MessageSchema);
    mongoose.model('session', SessionSchema);
    mongoose.model('application', ApplicationSchema);
    mongoose.model('conversation', ConversationSchema);

    next && next();
};
exports.defineModels = defineModels; 
