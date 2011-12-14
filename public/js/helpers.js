
// Helpers
// =======

(function() {
  // Save a reference to the global object.
  var root = this

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._

  // Extend the underscore object and pass
  // it our hash of function mixins
  _.mixin({
    timeFormat: function(miliseconds) {
      var now = new Date(miliseconds)
        , hour = now.getHours()
        , minute = now.getMinutes()

      if (hour < 10) { hour = '0' + hour }
      if (minute < 10) { minute = '0' + minute }
      return '[' + hour + ':' + minute + ']'
    }

  , split: function(val) {
      return val.split(/,\s*/)
    }

  , extractLast: function(term) {
      return _.split(term).pop()
    }

  , linkify: function(text) {
      var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.]*[-A-Z0-9+&@#\/%=~_|])/ig
      return text.replace(exp,"<a href='$1'>$1</a>") 
    }
  })

})()

// Backbone modularization
var module = function() {
  var cache = {}

  return function(name) {
    if (cache[name]) {
      return cache[name]
    }
    return cache[name] = { Views: {} }
  }
}()
