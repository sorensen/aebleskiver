# aebleskiver

![Mmmm...](http://upload.wikimedia.org/wikipedia/commons/0/04/Aebleskiver.jpg)

[Mmmm...](http://en.wikipedia.org/wiki/%C3%86bleskiver)

This project is a node.js realtime chat application, built with Express, Backbone and DNode. 
Data is persisted with MongoDB through Mongoose, using Redis for pub/sub messaging.  Backbone 
'sync' method has been overriden 


## Project dependancies (npm)

These packages can all be installed via 'npm install package'

[dnode @ 0.6.10](http://github.com/substack/dnode)

[socket.io @ 0.6.17](http://github.com/LearnBoost/Socket.IO-node)

[backbone @ 0.3.3](http://github.com/documentcloud/backbone)

[underscore @ 1.1.5](http://github.com/documentcloud/underscore)

[connect @ 1.4.1](http://github.com/senchalabs/connect)

[express @ 2.1.1](http://github.com/visionmedia/express)

[jade @ 0.10.1](http://github.com/visionmedia/jade)

[cluster @ 0.6.3](http://github.com/LearnBoost/cluster)

[cluster-live @ 0.0.3](http://github.com/visionmedia/cluster-live)

[node-gravatar @ 1.0.0](http://github.com/arnabc/node-gravatar)

[node-uuid @ 1.1.0](http://github.com/broofa/node-uuid)

[mongoose @ 1.3.0](http://github.com/LearnBoost/mongoose)

[connect-mongodb @ 0.3.0](http://github.com/kcbanner/connect-mongo)

mongodb @ 0.9.4-1

[bcrypt @ 0.2.3](http://github.com/ncb000gt/node.bcrypt.js)

[redis @ 0.6.0](http://github.com/mranney/node_redis)

[connect-redis @ 1.0.0](http://github.com/visionmedia/connect-redis)

[keys @ 0.1.2](http://github.com/visionmedia/keys)
    
## Installation

[Install node.js](http://github.com/joyent/node)

[Install NPM](http://github.com/joyent/npm)

## Features

* Multiple channel support
* User registration support
  * Public profiles
  * Chat wall
* Friends and favorites
* Personal messages
* Gravatar support
* Pub/Sub enabled
    
## In Development

* Private channels
* Channel admin controls
* Theme switcher