// twitter-node does not modify GLOBAL, that's so rude
var TwitterNode = require('twitter-node').TwitterNode
  , sys         = require('sys')

// you can pass args to create() or set them on the TwitterNode instance
var twit = new TwitterNode({
    user: '', 
    password: '',
    //host: 'my_proxy.my_company.com',            // proxy server name or ip addr
    //port: 8081,                                   // proxy port!
    track: ['node', 'backbone'],                  // sports!
    follow: [12345, 67890],                       // follow these random users
    locations: [-122.75, 36.8, -121.75, 37.8]     // tweets in SF
});

// adds to the track array set above
twit.track('foosball');

// adds to the following array set above
twit.follow(2345);

// follow tweets from NYC
twit.location(-74, 40, -73, 41)

// http://apiwiki.twitter.com/Streaming-API-Documentation#QueryParameters
twit.params['count'] = 100;

// http://apiwiki.twitter.com/Streaming-API-Documentation#Methods
twit.action = 'sample'; // 'filter' is default

twit.headers['User-Agent'] = 'whatever';

// Make sure you listen for errors, otherwise
// they are thrown
twit.addListener('error', function(error) {
  console.log(error.message);
});

twit
  .addListener('tweet', function(tweet) {
    sys.puts("@" + tweet.user.screen_name + ": " + tweet.text);
  })

  .addListener('limit', function(limit) {
    sys.puts("LIMIT: " + sys.inspect(limit));
  })

  .addListener('delete', function(del) {
    sys.puts("DELETE: " + sys.inspect(del));
  })

  .addListener('end', function(resp) {
    sys.puts("wave goodbye... " + resp.statusCode);
  })

  .stream();

// We can also add things to track on-the-fly
twit.track('#nowplaying');
twit.follow(1234);

// This will reset the stream
twit.stream();