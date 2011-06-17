# Installing on a Joyent Node Smart Machine

    Node.js and NPM should both be pre-installed for you 
    when using a Smart Machine, all project dependancies
    (npm packages) will still need to be installed, however.

## Installing MongoDB

(Joyent installation guide)[http://wiki.joyent.com/display/node/Installing+MongoDB+on+a+Node.js+SmartMachine]

    $ # assuming a 64 bit accelerator
    $ /usr/bin/isainfo -kv
    64-bit amd64 kernel modules

    $ # get mongodb
    $ # note this is 'latest' you may want a different version
    $ curl -O http://downloads.mongodb.org/sunos5/mongodb-sunos5-x86_64-latest.tgz
    $ gzip -d mongodb-sunos5-x86_64-latest.tgz
    $ tar -xf mongodb-sunos5-x86_64-latest.tar
    $ mv "mongodb-sunos5-x86_64-2009-10-26" mongo

    $ cd mongo

    $ # get extra libraries we need (else you will get a libstdc++.so.6 dependency issue)
    $ curl -O http://downloads.mongodb.org.s3.amazonaws.com/sunos5/mongo-extra-64.tgz
    $ gzip -d mongo-extra-64.tgz
    $ tar -xf mongo-extra-64.tar
    $ # just as an example - you will really probably want to put these somewhere better:
    $ export LD_LIBRARY_PATH=mongo-extra-64
    $ bin/mongod --help
    
## Installing Redis

(Joyent installation guide)[http://wiki.joyent.com/display/node/Node.js+SmartMachine+FAQ#Node.jsSmartMachineFAQ-redis]
    
Using the package manager:

    pkgin update; pkgin install redis
    svccfg import /opt/local/share/smf/manifest/redis.xml
    svcadm enable redis # automagically keep redis-server running

Building from source:

    $ wget http://redis.googlecode.com/files/redis-1.2.6.tar.gz
    $ gtar xzvf redis-1.2.6.tar.gz
    redis-1.2.6/
    redis-1.2.6/.gitignore
    
    $ cd redist-1.2.6
    $ CC=gcc gmake
    gcc -c -std=c99 -pedantic -O2 -Wall -W -D__EXTENSIONS__ -D_XPG6 -g -rdynamic -ggdb   adlist.c
    
    $ ./redis-server
