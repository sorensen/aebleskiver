
// Configuration file
// ------------------

module.exports = {

    // General
    session : {},
    redis : {
        options : {
            parser        : 'javascript',
            return_buffer : false
        }
    },
    mongo : {
        options : {
            auto_reconnect : true,
            native_parser  : true
        }
    },
    port   : 8080,
    cache  : { age : 60000 * 60 * 24 * 365},
    cookie : { age : 60000 * 60 * 1 },

    // Development settings
    development : {

        session : {
            secret   : 'abcdefg',
            username : '',
            password : ''
        },

        // Databases
        redis : {
            host : '127.0.0.1',
            port : 6379
        },

        mongo : {
            host : 'mongodb://localhost:27017/aebleskiver',
            port : 27017,
            name : 'aebleskiver'
        },

        // Ports
        port : 8080
    },

    // Testing settings
    testing : {

    },

    // Production settings
    production : {

        session : {
            secret   : 'somethingelse',
            username : '',
            password : ''
        },

        // Databases
        //redis : {
        //    host : 'redis://nodejitsu:08e43ef4e578babda0e7d52987dfe0dc@carp.redistogo.com',
        //    port : 9158
        //},

        //mongo : {
        //    host : 'mongodb://nodejitsu:cb6e44e190a5b74d76910e462e59c11a@staff.mongohq.com:10051/nodejitsudb954315905581',
        //    port : 10051,
        //    name : 'aebleskiver'
        //},

        // Ports
        port : 8080
    }
};
