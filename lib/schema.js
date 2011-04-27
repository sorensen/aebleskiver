/**
    Mongoose schema declarations
**/
// Module dependencies
var Mongoose = require('mongoose'),
    Schema   = Mongoose.Schema
    ObjectId = Schema.ObjectId;

    
/**
    Schema definitions
**/
// Message schema
var Message = new Schema({
    created  : { type : Date, default : Date.now },
    text     : String,
    username : String,
    avatar   : String
});
    
// Chat room schema
var Room = new Schema({
    name     : { type : String, index : true },
    created  : { type : Date, default : Date.now },
    messages : [Message],
    tags     : Array
});

// User schema
var User = new Schema({
    username    : { type : String, index : true },
    status      : { type : String, index : true },
    created     : { type : Date, default : Date.now },
    visits      : Number,
    displayName : String,
    avatar      : String,
    messages    : [Message],
    password    : String
});
    
// Application schema
var Application = new Schema({
    server  : { type : String, index : true },
    visits  : Number,
    users   : [User],
    rooms   : [Room]
});

/**
    Plugins
**/
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

// Activate plugins
Room.plugin(slugGenerator());


// Set models to mongoose
Mongoose.model('user',        User);
Mongoose.model('room',        Room);
Mongoose.model('message',     Message);
Mongoose.model('application', Application);