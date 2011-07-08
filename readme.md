# &AElig;bleskiver

Real-time multi-channel chat application. Project built with Express, Backbone and DNode,
and of course, Node.
 
Data is persisted with MongoDB through Mongoose, using Redis for pub/sub messaging.  Backbone 
'sync' method has been overriden using [backbone-dnode](http://github.com/sorensen/backbone-dnode) ,
providing a seamless interface between the client and server using Backbone models for the client, 
and backing them up with Mongoose schema's.  Although Backbone can be used on both the client and 
server, I find it benefitial to use seperate packages for each.

![Mmmm...](http://upload.wikimedia.org/wikipedia/commons/0/04/Aebleskiver.jpg)

[Mmmm...](http://en.wikipedia.org/wiki/%C3%86bleskiver)

## Documentation

Documentation can be found at http://sorensen.github.com/aebleskiver , as 
well as the annotated source code.

## Installation

Brief aside on how to install the project, this will soon be put into a full 
installation guide, but until then, you know the drill.

* [Install node.js](http://github.com/joyent/node)
* [Install NPM](http://github.com/joyent/npm)
* Install all project dependancies below with NPM

## Running the project

Starting the application will require MongoDB to be running in the background,
start the app by either running `server.js` which is the Clustered version, 
or just `app.js` for the single process.

    mongod --dbpath=./mongodb/data/aebleskiver --logpath./aebleskiver/logs/mongodb.log --logappend
    node server.js

### Project dependancies (npm)

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

### Docco (optional)

You can optionally install (Docco)[https://github.com/jashkenas/docco] if you decide
to contribute to the project and want to update the docs. Even if that means formatting
the comments to make the docs look better.

The normal installation for Docco can be found from the repo. I had some troubles installing 
and decided to list my steps for installing on a CentOS machine. The main difference being 
that Pygments had to be installed via easy_install, and the additional params on installing docco

    wget http://peak.telecommunity.com/dist/ez_setup.py
    sudo python ez_setup.py
    sudo easy_install Pygments
    npm install coffee-script
    sudo -E npm install -g docco
    
After Docco has been installed, you can generate new HTML files for any updates, 
using the CLI interface, the following will create docs for every javascript file.

    docco app.js server.js lib/*.js public/*.js public/models/*.js public/views/*.js public/routers/*.js public/rpc/*.js

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

## A word from the author

This has been a weekend project for me to play around with the underlying 
technologies, but has grown beyond my initial plans and expectations.  Feel free to use this 
project however you see fit, I do ask, however, that if you make changes that can benefit the 
community, to make a pull request with your updates. Cheers!