# aebleskiver

Real-time multi-channel chat application. Project built with Express, Backbone and DNode,
and of course, Node.  This has been a weekend project for me to play around with the underlying 
technologies, but has grown beyond my initial sandbox environment.  Feel free to use this 
project however you see fit, I do ask, however, that if you make changes that can benefit the 
community, to make a pull request with your updates.
 
Data is persisted with MongoDB through Mongoose, using Redis for pub/sub messaging.  Backbone 
'sync' method has been overriden using [backbone-dnode](http://github.com/sorensen/backbone-dnode) ,
providing a seamless interface between the client and server using Backbone models for the client, 
and backing them up with Mongoose schema's.  Although Backbone can be used on both the client and 
server, I find it benefitial to use seperate packages for each.

![Mmmm...](http://upload.wikimedia.org/wikipedia/commons/0/04/Aebleskiver.jpg)

[Mmmm...](http://en.wikipedia.org/wiki/%C3%86bleskiver)

## Project dependancies (npm)

These packages can all be installed via 'npm install package'

* [dnode @ 0.6.10](http://github.com/substack/dnode)
* [socket.io @ 0.6.17](http://github.com/LearnBoost/Socket.IO-node)
* [backbone @ 0.3.3](http://github.com/documentcloud/backbone)
* [underscore @ 1.1.5](http://github.com/documentcloud/underscore)
* [connect @ 1.4.1](http://github.com/senchalabs/connect)
* [express @ 2.1.1](http://github.com/visionmedia/express)
* [jade @ 0.10.1](http://github.com/visionmedia/jade)
* [cluster @ 0.6.3](http://github.com/LearnBoost/cluster)
* [cluster-live @ 0.0.3](http://github.com/visionmedia/cluster-live)
* [node-gravatar @ 1.0.0](http://github.com/arnabc/node-gravatar)
* [node-uuid @ 1.1.0](http://github.com/broofa/node-uuid)
* [mongoose @ 1.3.0](http://github.com/LearnBoost/mongoose)
* [connect-mongodb @ 0.3.0](http://github.com/kcbanner/connect-mongo)
* mongodb @ 0.9.4-1
* [bcrypt @ 0.2.3](http://github.com/ncb000gt/node.bcrypt.js)
* [redis @ 0.6.0](http://github.com/mranney/node_redis)
* [connect-redis @ 1.0.0](http://github.com/visionmedia/connect-redis)
* [keys @ 0.1.2](http://github.com/visionmedia/keys)
    
## Installation

* [Install node.js](http://github.com/joyent/node)
* [Install NPM](http://github.com/joyent/npm)

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

## How can I contribute?

Well now, thats a good question! If you are a developer wanting to help out, take a look
at the 'todos.md' file, or look at the 'In Development' section above.  I would love to see 
this flourish to be a community based application that we can all use.

If you are a designer, or a UI/UX guy, you can help shape the look and feel of this project, 
as I have been designing through code for this entire project.  I will have theme support settings 
added soon, so feel free to create additional themes, I currently have a default 'style.css' and 
one alternate wood based theme, 'wooden.css'.  I have more or less taken a [Zen Garden](http://www.csszengarden.com/)
approach to create the theming options.
