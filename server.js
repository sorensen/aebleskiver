
// Application Server
// ==================

// Dependencies
// ------------

var express       = require('express')
  , Mongo         = require('mongodb')
  , Session       = require('connect-mongo')
  , Mongoose      = require('mongoose')
  , mongooseAuth  = require('mongoose-auth')
  , Redis         = require('redis')
  , _             = require('underscore')._
  , Backbone      = require('backbone')
  , browserify    = require('browserify')
  , DNode         = require('dnode')
  , BackboneDNode = require('backbone-dnode')
  , colors        = require('colors')
  , Schemas       = require(__dirname + '/lib/schemas')
  , dnodeSession  = require(__dirname + '/lib/rpc/dnode-session')
  , dnodeOnline   = require('dnode-online')
  , auth          = require(__dirname + '/lib/rpc/backbone-auth')
  , logo          = require(__dirname + '/logo')
  , config        = require(__dirname + '/config.json')
  , app           = module.exports = express.createServer()

// Configuration
// -------------

var token = ''

// Development
app.configure('development', function(){
  app.use(express.static(__dirname + '/public'))
  app.use(express.static(__dirname + '/lib/modules'))
  app.use(express.static(__dirname + '/lib/rpc/browser'))
  app.use(express.static(__dirname + '/node_modules/backbone-dnode/browser'))
  app.use(express.static(__dirname + '/node_modules/dnode-cookie/lib'))
  
  app.use(express.errorHandler({
    dumpExceptions: true
  , showStack: true
  }))
  
  config = _.extend(config, config.development)
})

// Production
app.configure('production', function() {
  app.use(express.static(__dirname + '/public', {maxAge: config.cache.age}))
  app.use(express.errorHandler())
  config = _.extend(config, config.production)

  app.use(core)
})

// Redis configuration
var pub = Redis.createClient(config.redis.port, config.redis.host, config.redis.options)
  , sub = Redis.createClient(config.redis.port, config.redis.host, config.redis.options)
  , rdb = Redis.createClient(config.redis.port, config.redis.host, config.redis.options)

// Session
// -------

var session = new Session({
  db: config.mongo.name
})

// Server configuration
// --------------------

app.configure(function() {
  app.use(express.bodyParser())
  app.use(express.cookieParser())
  app.use(express.methodOverride())
  app.set('view engine', 'jade')
  
  app.use(express.session({
    cookie: {maxAge: config.cookie.age}
  , secret: config.session.secret
  , store: session
  }))
})

// Schemas
// -------

var Room
  , User
  , Profile
  , Token
  , Message

Schemas(Mongoose, function() {
  database = Mongoose.connect(config.mongo.host)

  Room = database.model('room')
  Profile = database.model('profile')
  Token = database.model('token')
  User = database.model('user')
  Message = database.model('message')
})

// Middleware
// ----------

function authFromToken(req, res, next) {
  var cookie = JSON.parse(req.cookies.logintoken)
  return next()

  if (cookie && cookie.token) {
    Token
      .findOne({
        _user: cookie._user
      , series: cookie.series
      , token: cookie.token 
      })
      .populate('_user')
      .run(function(err, token) {
        if (!token || !token._user) {
          return next()
        }
        req.session._user = token._user._id
        req.user = token._user

        token.token = token.randomToken()
        token.save(function() {
          res.cookie('logintoken', token.cookieValue, { 
            expires: new Date(Date.now() + 2 * 604800000)
          , path: '/' 
          })
          next()
        })
      })
  }
}

function loadUser(req, res, next) {
  if (req.session._user) {
    User.findById(req.session._user, function(err, user) {
      if (user) {
        req.user = user
      }
      next()
    })
  } else if (req.cookies.logintoken) {
    authFromToken(req, res, next)
  } else {
    next()
  }
}

function roomsAndProfiles(req, res, next) {
  Room.find(function(err, rooms) {
    req.rooms = rooms
    Profile.find(function(err, profiles) {
      req.profiles = profiles
      next()
    })
  })
}

// Routes
// ------

app.get('/', roomsAndProfiles, loadUser, function(req, res) {
  res.render('index.jade', {
    locals: {
      bootstrap: JSON.stringify({
        rooms: req.rooms
      , profiles: req.profiles
      })
    , user: JSON.stringify(req.user || null)
    }
  })
})

app.get('/rooms/:slug', roomsAndProfiles, loadUser, function(req, res) {  
  Room.findOne({
    slug: req.params.slug
  }
  , function(err, doc) {
    if (!doc) {
      return res.redirect('home')
    }
    Message.find({
      _room: doc._id
    }
    , function(err, messages) {
      var all = {}
      all[doc._id] = messages
      
      res.render('index.jade', {
        locals: {
          bootstrap: JSON.stringify({
            rooms: req.rooms
          , profiles: req.profiles
          , room: doc
          , messages: all
          })
        , user: JSON.stringify(req.user || null)
        }
      })
    })
  })
})

// Initialize
// ----------

if (!module.parent) {
  app.listen(config.port, function() {
    logo.print()
    console.log("Server configured for: ".green + (global.process.env.NODE_ENV || 'development') + " environment.".green)
    console.log("Server listening on port: ".green + app.address().port)
    console.log("")
  })
}

// General error handling
function errorHandler(client, conn) {
  conn.on('error', function(e) {
    console.log('Conn Error: ', e.stack)
  })
}

DNode()
  .use(errorHandler)
  .use(dnodeOnline({
    database: rdb
  , prefix: 'online:'
  , remove: true
  , offset: 6000 * 2
  , interval: 6000 * 1
  }))
  .use(BackboneDNode.pubsub({
    publish: pub
  , subscribe: sub
  }))
  .use(BackboneDNode.crud({
    database: database
  }))
  .use(dnodeSession({
    store: session
  }))
  .use(auth({
    database: database
  , store: session
  }))
  .listen(app)
