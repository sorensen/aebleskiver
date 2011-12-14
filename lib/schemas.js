
// Schemas
// =======

var root = this
  , MessageSchema
  , RoomSchema
  , ProfileSchema
  , UserSchema
  , TokenSchema

// Dependencies
// ------------

var bcrypt = require('bcrypt')
  , _ = require('underscore')._
  , Gravatar = require('node-gravatar')
  , mongooseAuth = require('mongoose-auth')
  , troop = require('mongoose-troop')

// Helpers
// -------

function emptyToSparse(str) {
  return (!str || !str.length) ? undefined : str
}

function validateEmail(email) {
  if (!email || email.length < 5 || !!~email.indexOf('@')) {
    return false
  }
  return true
}

function validatePresenceOf(value) {
  return value && value.length
}

module.exports = function(mongoose, next) {
  var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId

  // Message
  // -------

  MessageSchema = new Schema({
    _user: { type: ObjectId, ref: UserSchema, index: true }
  , _room: { type: ObjectId, ref: RoomSchema, index: true }
  , text: { type: String, trim: true }
  , username: { type: String, trim: true }
  , avatar: { type: String, trim: true }
  })

  MessageSchema.plugin(troop.filter)
  MessageSchema.plugin(troop.addCreatedAndModified)
  MessageSchema.path('created').index(true)

  // Room
  // ----

  RoomSchema = new Schema({
    _user: { type: ObjectId, ref: UserSchema }
  , name: {
      type: String
    , trim: true
    , lowercase: true
    , required: true
    , index: { unique: true }
  }
  , slug: {
      type: String
    , trim: true
    , lowercase: true
    , index: { unique: true }
  }
  , tags: Array
  , description: String
  , rank: { type: Number, default: 0 }
  , restricted: { type: Boolean, default: false }
  , allowed: Array
  , banned: Array
  , upvotes: { type: Number, default: 0 }
  , downvotes: { type: Number, default: 0 }
  })

  RoomSchema.plugin(troop.filter)
  RoomSchema.plugin(troop.addCreatedAndModified)
  RoomSchema.path('created').index(true)

  RoomSchema.plugin(troop.keywords, {
    source: ['name', 'description']
  })

  RoomSchema.plugin(troop.slugify, {
    source: 'name'
  , maxLength: 60
  })

  // User
  // ----

  UserSchema = new Schema({
    first_name: { type: String, trim: true }
  , last_name: { type: String, trim: true }
  , email: { 
      type: String
    , lowercase: true
    , set: emptyToSparse
    , index: { unique: true, sparse: true } 
  }
  })

  UserSchema.plugin(troop.filter)
  UserSchema.plugin(troop.basicAuth)
  UserSchema.plugin(troop.addCreatedAndModified)
  UserSchema.path('created').index(true)

  UserSchema
    .pre('save', function(next) {
      var Profile = database.model('profile')
        , self = this
      
      Profile.findOne({
        _user: this._id
      }
      , function(err, doc) {
        if (err) return next(err)
        if (doc) return next()

        instance = new Profile({
          _user: self._id
        })
        instance.save(function(err) {
          if (err) return next(err)
          next()
        })
      })
    })

  UserSchema
    .pre('remove', function(next) {
      var Profile = database.model('profile')
      Profile.findOne({
        _user: this._id
      }
      , function(err, doc) {
        if (err) return next(err)
        if (!doc) return next()
        doc.remove(function(err) {
          next(err)
        })
      })
    })

  UserSchema
    .pre('set', function(next, path, val, type) {
      if (path == 'email') {
        if (!validateEmail(val)) {
          return next()
        }
        profile = mongoose.model('profile')
        profile.findOne({
          _user: this._id
        }, function(err, doc) {
          if (!err) {
            doc.set('avatar', Gravatar.get(this.email, 'R', '120', 'mm'))
          }
        })
      }
      next()
    })

  // Profile
  // -------

  ProfileSchema = new Schema({
    _user: { 
      type: ObjectId
    , ref: UserSchema
    , unique: true
    , required: true 
  }
  , visits: { type: Number, default: 0 }
  , displayName: { type: String, trim: true }
  , bio: { type: String, trim: true }
  , avatar: { type: String, trim: true }
  , restricted: { type: Boolean, default: false }
  , friends: Array
  , blocked: Array
  , favorites: Array
  })

  ProfileSchema.plugin(troop.filter)
  ProfileSchema.plugin(troop.addCreatedAndModified)
  ProfileSchema.path('created').index(true)

  // Token
  // -----

  TokenSchema = new Schema({
    _user: { type: ObjectId, ref: UserSchema, index: true }
  , series: { type: String, index: true }
  , token: { type: String, index: true }
  })

  TokenSchema.plugin(troop.filter)

  TokenSchema
    .method('randomToken', function() {
      return Math.round((new Date().valueOf() * Math.random())) + ''
    })

  TokenSchema
    .pre('save', function(next) {
      this.token = this.randomToken()
      if (this.isNew) {
        this.series = this.randomToken()
      }
      next()
    })

  TokenSchema
    .virtual('id')
    .get(function() {
      return this._id.toHexString()
    })

  TokenSchema
    .virtual('cookieValue')
    .get(function() {
      return JSON.stringify({
        _user: this._user
      , token: this.token
      , series: this.series
      })
    })

  // Set models to mongoose
  mongoose.model('user', UserSchema)
  mongoose.model('profile', ProfileSchema)
  mongoose.model('room', RoomSchema)
  mongoose.model('token', TokenSchema)
  mongoose.model('message', MessageSchema)

  next && next()
}
