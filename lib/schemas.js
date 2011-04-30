// Mongoose ORM Schemas
// --------------------

// Exports for CommonJS
var Schemas;
if (typeof exports !== 'undefined') {
    Mongoose = require('mongoose');
    Schema   = Mongoose.Schema;
    ObjectId = Schema.ObjectId;
    Schemas  = module.exports = {};
}

// Slug generator middleware
function slugGenerator (options){
    options = options || {};
    var key = options.key || 'name';

    return function slugGenerator(schema){
        schema.path(key).set(function(v){
            this.slug = v.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/-+/g, '');
            return v;
        });
    };
};

// Schema definitions
Schemas = {

    Message : new Schema({
        room     : { type : String, index : true },
        created  : { type : Date, default : Date.now },
        text     : String,
        username : String,
        avatar   : String
    }),

    // Chat room schema
    Room : new Schema({
        name     : { type : String, index : { unique : true } },
        created  : { type : Date, default : Date.now },
        messages : [Schemas.Message],
        tags     : Array
    }),

    // User schema
    User : new Schema({
        username    : { type : String, index : { unique : true } },
        email       : { type : String, index : { unique : true } },
        status      : { type : String, index : true },
        created     : { type : Date, default : Date.now },
        visits      : Number,
        displayName : String,
        avatar      : String,
        messages    : [Schemas.Message],
        password    : String
    }),
        
    // Application schema
    Application : new Schema({
        server  : { type : String, index : { unique : true } },
        visits  : Number,
        users   : [Schemas.User],
        rooms   : [Schemas.Room]
    })
};

// Definition plugins
Schemas.Room.plugin(slugGenerator());

// Set models to mongoose
Mongoose.model('user',        Schemas.User);
Mongoose.model('room',        Schemas.Room);
Mongoose.model('message',     Schemas.Message);
Mongoose.model('application', Schemas.Application);