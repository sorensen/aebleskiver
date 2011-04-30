# Installing on a Joyent Node Smart Machine


## Installing MongoDB

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