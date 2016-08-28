/**
 * Created by karim on 28/08/2016.
 */
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');

var strategy = new Auth0Strategy({
    domain:       'exploreauth.auth0.com',
    clientID:     'QqJgTRPIWyFTKdpkMD8ATmeSwvw6oBCA',
    clientSecret: 'FMRd-u048h9_t95D-hJjTtO5K7uZFmmJ5ruHCP6TrUnaxiSVsKhFSE57jkH68EMc',
    callbackURL:  '/callback'
}, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
});

passport.use(strategy);

// This is not a best practice, but we want to keep things simple for now
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

module.exports = strategy;