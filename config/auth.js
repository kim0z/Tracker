/**
 * Created by karim on 29/01/2016.
 */
// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '942317529184852', // your App ID
        'clientSecret'  : '0e1f723cae07cf368994bf4c9b6a10cc', // your App Secret
        'callbackURL'   : 'http://localhost:8080/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : 'your-secret-clientID-here',
        'clientSecret'  : 'your-client-secret-here',
        'callbackURL'   : 'http://localhost:8080/auth/google/callback'
    },
    'auth0'      : {
        domain          : 'exploreauth.auth0.com',
        clientID        : 'QqJgTRPIWyFTKdpkMD8ATmeSwvw6oBCA'
    }

};