
// Initialization
// --------------
var Server
  , conn

(function() {
  var root = this
    , connected = false
    , refresh
    , App = module('app')
  
  // Create the application router, this will only
  // need to be created once, even if we reconnect
  var routing = _.once(function(remote) {
    new App.Router({ 
      server: remote
    })
  })

  // Restart the socket connection
  function connect() {
    initialize()
    if (!connected) {
      clearTimeout(refresh)
      refresh = setTimeout(connect, 20000)
    }
  }

  // Shim for non-browserify includes
  if ('undefined' !== typeof middleware) {
    root.dnodeBackbone = middleware.dnodeBackbone
  }

  function reconnect(client, con) {
    con.on('error', function(err) {
      throw err 
    })

    // Socket connection has been terminated
    con.on('end', function() {
      connected = false
      refresh = setTimeout(connect, 500)
    })
    
    // Socket connection established
    con.on('ready', function() {
      connected = true
      clearTimeout(refresh)
    })
  }
  
  // Seperate the connection function in case
  // we need to use it for reconnecting
  function initialize() {
  
    DNode()
      .use(reconnect)
      .use(root.dnodeBackbone)
      .use(root.dnodeCookie)
      .connect(function(remote) {
        routing(remote)
      })
  }
  
  $(function() {
    initialize()
  })

})()
