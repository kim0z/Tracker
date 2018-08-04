// set up ======================================================================
//                    @@@ Karim Fanadka @@
//   ** Be the agent of your self, plan, execute and share **
//
//
// #############################################################################

var http = require('http');
var database = require('./config/database');
var multiparty = require('multiparty'); //for upload photos
var express = require('express');
var app = express();
var fs = require('fs');
//app.use(compression());                           
var port = process.env.PORT || 9090;
var server = http.createServer(app);
var AWS = require('aws-sdk');

var io = require('socket.io').listen(server);

server.listen(8080);

//extract Exif metadata from images
var ExifImage = require('exif').ExifImage;

//var mongoose = require('mongoose');                   // mongoose for mongodb             // set the port
//var database = require('./config/database');          // load the database config
var Firebase = require("firebase"); //Firebase cloud Database No Sql

var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyAYmaDkXwJwOqSpgr2fODrjcr6gXdA3RCM',
    Promise,
    timeout: 60 * 10000 //(Default: 60 * 1000 ms)
});

var Dropbox = require("dropbox"); //dropbox - to get the files of GPS, XML format

//PostgresSQL
var pg = require('pg');

var conString = '';


switch (process.argv[2]) {
    case 'production':
        console.log('production mode')
        conString = database.production;
        break;
    case 'test':
        console.log('test mode')
        conString = database.test;
        break;
    case 'test_work':
        console.log('test at work mode')
        conString = database.test_work;
        break;
    default:
        console.log('test mode')
        conString = database.test;
        break;
}

var client = new pg.Client(conString);
//client.connect();


var config = require('./config'); //general config, passwords, accounts, etc

var morgan = require('morgan'); // log requests to the console (express4)
var bodyParser = require('body-parser'); // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)

//FireBase DB
var FirebaseRef = new Firebase("https://luminous-torch-9364.firebaseio.com/"); //Firebase DB connection

// configuration ===============================================================


//******************************* Auth0 passport *******************************************
//******************************************************************************************
var passport = require('passport');

// This is the file we created in step 2.
// This will configure Passport to use Auth0
var strategy = require('./config/setup-passport');

// Session and cookies middlewares to keep user logged in
var cookieParser = require('cookie-parser');
var session = require('express-session');


app.use(cookieParser());
// See express session docs for information on the options: https://github.com/expressjs/session
app.use(session({
    secret: 'FMRd-u048h9_t95D-hJjTtO5K7uZFmmJ5ruHCP6TrUnaxiSVsKhFSE57jkH68EMc',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//******************************* Auth0 ended **********************************************

//mongoose.connect(database.url);   // connect to mongoDB database on modulus.io

app.use(express.static(__dirname + '/public')); // set static path
app.use(morgan('dev')); // log every request to the console

//bodyParser
// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true, parameterLimit: 50000}));
app.use(bodyParser.json({limit: '100mb'})); // parse application/json
//app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride());


//CROSS SITE SCRIPT
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// routes 
require('./app/routes.js')(app);

//######################################################################################################################


// #########################################
//####          Sabre Services           ##
//#########################################
/*
 var SabreDevStudio = require('sabre-dev-studio');
 var sabre_dev_studio = new SabreDevStudio({
 client_id: 'V1:9cylb1mwz5k3rrce:DEVCENTER:EXT',
 client_secret: '1ECrofY1',
 uri: 'https://api.test.sabre.com'
 });
 var options = {city: 'London'};
 var callback = function (error, data) {
 if (error) {
 console.log(error);
 } else {
 console.log(JSON.stringify(JSON.parse(data)));
 }
 };
 sabre_dev_studio.get('/v1/lists/airports', options, callback);
 */


//Auth0
//######################
//######################
//######################

var request = require("request");
var auth0ApiToken = '';
var options = {
    method: 'POST',
    url: 'https://exploreauth.auth0.com/oauth/token',
    headers: {'content-type': 'application/json'},
    body: '{"client_id":"yt6jXOEvG4IMyCmBHK4tFQM3y0J0CLk5","client_secret":"jMH6KWIMXkRGUeJWZQMkkFT7hqtTr2amnw49TxZDDxAmzt5ALhHiP_pRTmZFiGaJ","audience":"https://exploreauth.auth0.com/api/v2/","grant_type":"client_credentials"}'
};

request(options, function (error, response, body) {
    if (error) throw new Error(error);
    auth0ApiToken = body;
    console.log(body);
    auth0ApiToken = JSON.parse(body);

});

var gps_accuracy = 10; //client have the ability to control accuracy

app.post('/changeGPSAccuracy', function (request, res) {
    console.log('LOG:: Server :: change GPS accuracy');
    console.log(request.body.gps_accuracy);
    gps_accuracy = request.body.gps_accuracy;
});

app.post('/getGPSAccuracy', function (request, res) {
    console.log('LOG:: Server :: get GPS accuracy');
    console.log(gps_accuracy);
    res.json(gps_accuracy);
});

app.post('/getProviderToken', function (request, res) {

    var requestHttp = require("request");
    console.log('SERVER:: Auth0::  get provider token');
    console.log(request.body.user_id);

    var options = {
        method: 'GET',
        url: 'https://exploreauth.auth0.com/api/v2/users/' + request.body.user_id,
        headers: {authorization: 'Bearer ' + auth0ApiToken.access_token}
    };
    requestHttp(options, function (error, response, body) {
        if (error) {
            console.log('error :: server :: getProviderToken :: no token, server shold be restart, bug: re ask for the token')
            console.log(error);
        }
        console.log(body);
        res.end(body);
    });
});
// ########################
// #### EXIF ##############
// ########################
app.post('/getPhotoMetadata', function (request, response) {

    console.log('SERVER:: extract metadata from photo');
    console.log(request.body);
    console.log(request.body.img);
    var img = request.body.img;

    var request = require('request').defaults({encoding: null});
    request.get(img, function (err, res, body) {
        console.log(body);
        try {
            new ExifImage({image: body}, function (error, exifData) {
                if (error) {
                    console.log('Error: ' + error.message);
                    response.status(500).end()
                } else {
                    console.log(exifData); // Do something with your data!
                    response.send(exifData);
                }
            });
        } catch (error) {
            console.log('Error: ' + error.message);
            response.status(500).end()
        }
    });
});
// ############ END EXIF ###############
////################# Sabre Services Config ended #############################
// General variables
var tripById = '';
var sockets = [];
/////////////////////

//#####################################################
//# Rest Calls                                       #
//####################################################
//REST calls for Postgres DB

//Auth0
//Auth0 callback handler
app.get('/callback',
    passport.authenticate('auth0', {failureRedirect: '/url-if-something-fails'}),
    function (req, res) {
        console.log('inside callback auth0');
        if (!req.user) {
            throw new Error('user null');
        }
        res.redirect("/view0");
    });

//////////// User Auth DB  ///////////////////////


////////// Get Trip Path from Firebase ///////////
//Postgres :: Check if user exists

////// Check GPS point accuracy
var checkAccuracy = function (GPS_Point, accuracy) {
    //console.log(GPS_Point['coords'].accuracy);
    if (GPS_Point['coords'].accuracy < accuracy) {
        return true;
    }
}

//Get Path from Firebase
app.post('/getTripPath', function (request, response) {
    console.log('SERVER:: Firebase::  Get Trip Path');
    var tripDays = request.body.tripDays;
    console.log('Trip days: ' + request.body.tripDays);
    console.log('User ID: ' + request.body.userId);
    console.log('Trip Id: ' + request.body.tripId);
    var firebase_trip_path = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + request.body.userId + "/" + request.body.tripId + "/path");
    //var firebase_trip_path = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/10207022211887806/216/path");

    firebase_trip_path.once("value", function (snapshot) {
        //console.log(snapshot.val());

        var trip_path = [];
        snapshot.forEach(function (item) {
            trip_path.push(item.val());
        });

        //console.log(trip_path);
        console.log('Trip path loaded');
        console.log('Trip path length : ' + trip_path.length);

        //When path loaded, sort it by timestamp - the path could be sorted by default ????????????
        //trip_path.sort(function (a, b) {
        //    return new Date(a.timestamp) - new Date(b.timestamp);
        //});
        //when path sorted, save it into hash table for easy use
        //$scope.trip_path_hash [0] = $scope.trip_path; //day zero is all the trip
        var path_first_date = '';
        for (var trip_first_day_index = 0; trip_first_day_index < trip_path.length; trip_first_day_index++) {
            if (trip_path[trip_first_day_index].timestamp != null) {
                console.log('First date found in the GPS points array:: ' + trip_path[trip_first_day_index].timestamp);
                path_first_date = trip_path[trip_first_day_index].timestamp; //know what is the first datei
                path_first_date = new Date(parseInt(path_first_date));
                path_first_date = path_first_date.toISOString();
                break;
            }
        }
        console.log('first date: ' + path_first_date);

        var day = 0;
        var path_last_index = 0;
        var trip_path_hash = [];
        //$scope.trip_path_hash = new Array($scope.tripDays + 1);
        for (var hash_index = 0; hash_index < tripDays + 1; hash_index++) { //init hashtable with extra 10 cells, I removed the 10 extra no need
            trip_path_hash[hash_index] = [];
        }

        for (var i = 0; i < tripDays - 1; i++) {

            for (var j = path_last_index; j < trip_path.length; j++) { //each day should be saved into new celi

                if (day < tripDays) {
                    console.log('Path Index:: ' + j + ' of ' + trip_path.length)
                    console.log('GPS Point date:: ' + trip_path[j].timestamp);
                    var d = new Date(parseInt(trip_path[j].timestamp));
                    trip_path[j].timestamp = d;
                    trip_path[j].timestamp = trip_path[j].timestamp.toISOString();
                    if (trip_path[j]['timestamp'] && path_first_date) {
                        console.log('GPS Point date after convert ' + trip_path[j].timestamp.substring(0, 10));
                        console.log('First date in loop:: ' + path_first_date);

                        //trip_path[j].timestamp = trip_path[j].timestamp.toString();
                        //path_first_date = path_first_date.toString();

                        if (trip_path[j].timestamp.substring(0, 10) == path_first_date.substring(0, 10)) {
                            if (checkAccuracy(trip_path[j], gps_accuracy)) { //check accuracy
                                trip_path_hash[day].push(
                                    {
                                        lat: JSON.parse(trip_path[j]['coords'].latitude),
                                        lng: JSON.parse(trip_path[j]['coords'].longitude),
                                        timestamp: trip_path[j]['timestamp'],
                                        data: trip_path[j]
                                    }
                                );
                            }
                        } else {
                            //if date changed it means new day started, updated day and path index
                            console.log('day');
                            console.log('Starting new date ' + day++);
                            day++;
                            path_last_index = j;
                            path_first_date = trip_path[j].timestamp;
                            console.log('new first date: ' + path_first_date);

                        }
                    }
                } else {
                    console.log('Trip path not sliced into hash because of date issue')
                }
            }
        }
        //console.log('HASH');
        //console.log(trip_path_hash);
        response.send(trip_path_hash);
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
});


//get path
//app.post('/getPathJsonPostgres', function (request, response) {
var getPathJsonPostgres = function (tripid) {
    console.log('SERVER:: Postgres:: get Trip path from postgres');
    var results = [];
    //console.log(request.body);
    // Get a Postgres client from the connection pool
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            //return response.status(500).json({success: false, data: err});
        }
        //var email = "'" + request.body.email + "'";
        // SQL Query > Select Data
        var query = client.query("SELECT path FROM trips WHERE id = ($1)", [tripid]); //request.body.id

        console.log(query);
        // Stream results back one row at a time
        query.on('row', function (row) {
            console.log(row);
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function () {
            done();
            return results;
        });
    });
}

//Get Path from Postgres
app.post('/getTripPathPostgres', function (request, response) {
    console.log('SERVER:: Posgtres::  Get Trip Path');
    var tripDays = request.body.tripDays;
    console.log('Trip days: ' + request.body.tripDays);
    console.log('User id: ' + request.body.userId);
    console.log('Trip id: ' + request.body.tripId);

    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            pg.end();
            console.log(err);
            return response.status(500).json({success: false, data: err});
        }
        // SQL Query > Select Data
        var query = client.query("SELECT path FROM trips WHERE id = ($1)", [request.body.tripId]); //request.body.id

        // Stream results back one row at a time
        query.on('row', function (row) {
            // console.log(row);
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function () {
            pg.end();

            //console.log(results)
            var trip_path = results[0].path;

            console.log('Trip path loaded');
            console.log('Trip path length : ' + trip_path.length);

            var path_first_date = '';

            for (var trip_first_day_index = 0; trip_first_day_index < trip_path.length; trip_first_day_index++) {
                if (trip_path[trip_first_day_index].timestamp != null) {
                    console.log('First date found in GPS points array:: ' + trip_path[trip_first_day_index].timestamp);
                    path_first_date = trip_path[trip_first_day_index].timestamp;
                    path_first_date = new Date(parseInt(path_first_date));
                    path_first_date = path_first_date.toISOString();
                    console.log('First date set :' + path_first_date);
                    break;
                }
            }

            var push_count = 0;
            var day = 0;
            var path_last_index = 0;
            var trip_path_hash = [];

            for (var hash_index = 0; hash_index < tripDays + 1; hash_index++) {
                trip_path_hash[hash_index] = [];
            }

            build_hash:
                for (var i = 0; i < tripDays; i++) {
                    for (var j = path_last_index; j < trip_path.length; j++) { //each day should be saved into new cell
                        if (j == trip_path.length || j == trip_path.length - 1 || j > trip_path.length) {
                            console.log('***************************************************************************************************');
                            break build_hash;
                        }
                        if (day < tripDays) {
                            //Debug
                            console.log('Path Index:: ' + j + ' of ' + trip_path.length)
                            console.log('GPS Point date:: ' + trip_path[j].timestamp);

                            var d = new Date(parseInt(trip_path[j].timestamp));
                            trip_path[j].timestamp = d;
                            trip_path[j].timestamp = trip_path[j].timestamp.toISOString();
                            if (trip_path[j]['timestamp'] && path_first_date) {

                                //Debug
                                console.log('GPS Point date after convert ' + trip_path[j].timestamp);
                                console.log('First date in loop:: ' + path_first_date);

                                console.log('Current GPS pont timestamp: ' + trip_path[j].timestamp.substring(0, 10));
                                console.log('First date: ' + path_first_date.substring(0, 10));

                                if (trip_path[j].timestamp.substring(0, 10) == path_first_date.substring(0, 10)) {
                                    // if (checkAccuracy(trip_path[j], gps_accuracy)) { //check accuracy
                                    trip_path_hash[day].push(
                                        {
                                            lat: JSON.parse(trip_path[j]['coords'].latitude),
                                            lng: JSON.parse(trip_path[j]['coords'].longitude),
                                            timestamp: trip_path[j]['timestamp'],
                                            data: trip_path[j]
                                        }
                                    );
                                    push_count++;
                                    //}
                                } else {
                                    //if date changed it means new day started, updated day and path index
                                    console.log('Starting new day ' + day++);
                                    day++;
                                    console.log('Last index: ' + j);
                                    path_last_index = j;
                                    path_first_date = trip_path[j].timestamp;
                                    console.log('new first date: ' + path_first_date);
                                }
                            }
                        } else {
                            //console.log('Trip path not sliced into hash because of date issue')
                        }
                    }
                }
            response.send({hash: trip_path_hash, length: push_count});
        });
    });
});

//Get Path from Postgres -- DELETE I created a new one above
/*app.post('/getTripPathPostgres', function (request, response) {
 console.log('SERVER:: Posgtres::  Get Trip Path');
 var tripDays = request.body.tripDays;
 console.log('Trip days: ' + request.body.tripDays);
 console.log('User ID: ' + request.body.userId);
 console.log('Trip Id: ' + request.body.tripId);

 // firebase_trip_path.once("value", function (snapshot) {

 var results = [];
 //console.log(request.body);
 // Get a Postgres client from the connection pool
 pg.connect(conString, function (err, client, done) {
 // Handle connection errors
 if (err) {
 pg.end();
 console.log(err);
 //return response.status(500).json({success: false, data: err});
 }
 //var email = "'" + request.body.email + "'";
 // SQL Query > Select Data
 var query = client.query("SELECT path FROM trips WHERE id = ($1)", [request.body.tripId]); //request.body.id

 //console.log(query);
 // Stream results back one row at a time
 query.on('row', function (row) {
 // console.log(row);
 results.push(row);
 });

 // After all data is returned, close connection and return results
 query.on('end', function () {
 pg.end();
 //return results;

 //getPathJsonPostgres(request.body.tripId).then(function (results) {

 //Trying to get Path from Postgres
 console.log(results)
 var trip_path = results[0].path;

 console.log('Trip path loaded');
 console.log('Trip path length : ' + trip_path.length);

 //When path loaded, sort it by timestamp - the path could be sorted by default ????????????
 //trip_path.sort(function (a, b) {
 //    return new Date(a.timestamp) - new Date(b.timestamp);
 //});
 //when path sorted, save it into hash table for easy use
 //$scope.trip_path_hash [0] = $scope.trip_path; //day zero is all the trip
 var path_first_date = '';
 for (var trip_first_day_index = 0; trip_first_day_index < trip_path.length; trip_first_day_index++) {
 if (trip_path[trip_first_day_index].timestamp != null) {
 console.log('First date found in the GPS points array:: ' + trip_path[trip_first_day_index].timestamp);
 path_first_date = trip_path[trip_first_day_index].timestamp; //know what is the first datei
 path_first_date = new Date(parseInt(path_first_date));
 path_first_date = path_first_date.toISOString();
 break;
 }
 }
 console.log('first date: ' + path_first_date);

 var push_count = 0;
 var day = 0;
 var path_last_index = 0;
 var trip_path_hash = [];
 //$scope.trip_path_hash = new Array($scope.tripDays + 1);
 for (var hash_index = 0; hash_index < tripDays + 1; hash_index++) { //init hashtable with extra 10 cells, I removed the 10 extra no need
 trip_path_hash[hash_index] = [];
 }
 for (var i = 0; i < tripDays - 1; i++) {
 for (var j = path_last_index; j < trip_path.length; j++) { //each day should be saved into new celi
 if (day < tripDays) {
 //Debug
 console.log('Path Index:: ' + j + ' of ' + trip_path.length)
 console.log('GPS Point date:: ' + trip_path[j].timestamp);

 var d = new Date(parseInt(trip_path[j].timestamp));
 trip_path[j].timestamp = d;
 trip_path[j].timestamp = trip_path[j].timestamp.toISOString();
 if (trip_path[j]['timestamp'] && path_first_date) {

 //Debug
 console.log('GPS Point date after convert '+trip_path[j].timestamp.substring(0, 10));
 console.log('First date in loop:: ' + path_first_date);

 if (trip_path[j].timestamp.substring(0, 10) == path_first_date.substring(0, 10)) {
 if (checkAccuracy(trip_path[j], gps_accuracy)) { //check accuracy
 trip_path_hash[day].push(
 {
 lat: JSON.parse(trip_path[j]['coords'].latitude),
 lng: JSON.parse(trip_path[j]['coords'].longitude),
 timestamp: trip_path[j]['timestamp'],
 data: trip_path[j]
 }
 );
 push_count++;
 }
 } else {
 //if date changed it means new day started, updated day and path index
 console.log('Starting new date ' + day++);
 day++;
 path_last_index = j;
 path_first_date = trip_path[j].timestamp;
 //console.log('new first date: '+path_first_date);
 }
 }
 } else {
 //console.log('Trip path not sliced into hash because of date issue')
 }
 }

 }
 response.send({hash: trip_path_hash, length: push_count});

 });
 });
 });*/
/*app.post('/getTripPath', function (request, response) {
 console.log('SERVER:: Firebase::  Get Trip Path');
 var tripDays = request.body.tripDays;
 console.log('Trip days: ' + request.body.tripDays);
 console.log('User ID: ' + request.body.userId);
 console.log('Trip Id: ' + request.body.tripId);
 var firebase_trip_path = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + request.body.userId + "/" + request.body.tripId + "/path");
 //var firebase_trip_path = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/10207022211887806/216/path");

 firebase_trip_path.once("value", function (snapshot) {
 //console.log(snapshot.val());

 var trip_path = [];
 snapshot.forEach(function (item) {
 trip_path.push(item.val());
 });

 //console.log(trip_path);
 console.log('Trip path loaded');
 console.log('Trip path length : ' + trip_path.length);

 //When path loaded, sort it by timestamp - the path could be sorted by default ????????????
 //trip_path.sort(function (a, b) {
 //    return new Date(a.timestamp) - new Date(b.timestamp);
 //});
 //when path sorted, save it into hash table for easy use
 //$scope.trip_path_hash [0] = $scope.trip_path; //day zero is all the trip
 var path_firast_date = '';
 for (var trip_first_day_index = 0; trip_first_day_index < trip_path.length; trip_first_day_index++) {
 if (trip_path[trip_first_day_index].timestamp != null) {
 path_firast_date = trip_path[trip_first_day_index].timestamp; //know what is the first date
 break;
 }
 }
 console.log('first date: ' + path_firast_date);

 var day = 0;
 var path_last_index = 0;
 var trip_path_hash = [];
 //$scope.trip_path_hash = new Array($scope.tripDays + 1);
 for (var hash_index = 0; hash_index < 100; hash_index++) { //init hashtable with extra 10 cells, I removed the 10 extra no need
 trip_path_hash[hash_index] = [];
 }

 for (var i = 0; i < tripDays; i++) {
 console.log('inside loop1');
 for (var j = path_last_index; j < trip_path.length; j++) { //each day should be saved into new cel
 console.log('inside loop2')
 console.log('path length');
 console.log(trip_path.length);
 console.log('path index');
 console.log(path_last_index);
 if (trip_path[j]['timestamp'] && path_firast_date) {
 console.log('if 1');
 if (trip_path[j].timestamp.substring(0, 10) == path_firast_date.substring(0, 10)) {
 console.log('if 2');
 if (checkAccuracy(trip_path[j], gps_accuracy)) { //check accuracy
 console.log('if 3');
 console.log(day);
 console.log(trip_path_hash.length);
 trip_path_hash[day].push(
 {
 lat: JSON.parse(trip_path[j]['coords'].latitude),
 lng: JSON.parse(trip_path[j]['coords'].longitude),
 timestamp: trip_path[j]['timestamp'],
 data: trip_path[j]
 }
 );
 }
 } else {
 //if date changed it means new day started, updated day and path index
 console.log('day');
 console.log(day++);
 day++;
 path_last_index = j;
 path_firast_date = trip_path[j].timestamp;
 }
 } else {
 console.log('Trip path not sliced into hash because of date issue')
 }
 }
 }
 //console.log('HASH');
 //console.log(trip_path_hash);
 response.send(trip_path_hash);
 }, function (errorObject) {
 console.log("The read failed: " + errorObject.code);
 });
 });*/

//get Trip Places
app.post('/getTripPlaces', function (request, response) {
    console.log('SERVER:: Firebase::  Get Trip Places');

    var path = request.body.path;
    //console.log(request.body.path);

    var placeStayingTime, interestPoints = [];
    for (var i = 0; i < path.length - 1; i++) {
        for (var j = 0; j < path[i].length; j++) {
            if (path[i + 1][j] && path[i + 1][j]['timestamp']) {
                placeStayingTime = (((new Date(path[i + 1][j]['timestamp']).getTime() - new Date(path[i][j]['timestamp']).getTime()) / 1000) / 60);
                if (placeStayingTime > 30) {
                    var request = {
                        location: {
                            lat: path[i][j]['lat'],
                            lng: path[i][j]['lng']
                        },
                        radius: '1'
                    };
                    interestPoints.push(request);
                }
            }
        }
    }

    //start loop interest points to get places ids
    console.log('SERVER:: start loop interest points to get places ids');
    var nearbyPlaces = [];
    var counter = 0;
    for (var places_index = 0; places_index < interestPoints.length; places_index++) {
        googleMapsClient.placesNearby({
                location: [interestPoints[places_index].location.lat, interestPoints[places_index].location.lng],
                radius: 1
            })
            .asPromise()
            .then(function (result) {
                counter++;
                if (result.json.status == 'OK') {
                    //console.log(result);
                    nearbyPlaces.push(result);
                }
            })
            .catch(function (err) {
                // Throw the error outside the Promise, or log it, or something.
                console.log(err);
            });
    }
    response.send(nearbyPlaces)
});

//Postgres :: Check if user exists
app.post('/checkUserExistsByEmail', function (request, response) {

    console.log('SERVER:: Postgres::  Check if user exists by email');
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return response.status(500).json({success: false, data: err});
        }

        console.log(request.body.email);
        // SQL Query > Select Data
        var query = client.query("SELECT EXISTS (SELECT * FROM users WHERE email = \'" + request.body.email + "\');", function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            return response.json(result);
            //output: 1
        });
    });
});

//Postgres :: add new user
app.post('/addNewUser', function (request, response) {

    console.log('SERVER:: Postgres::  Add new user');
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }
        var query = client.query("INSERT INTO users(email, name, provider, provider_id, cell_number, active_trip) values($1, $2, $3, $4, $5, $6)", [request.body.email, request.body.name, 'facebook', request.body.id, '0500000000', true], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            // add response to client about success
        });
    });
});

//Postgres :: add new user
app.post('/getUsersList', function (request, response) {

    console.log('SERVER:: Postgres::  get users list');
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }
        var query = client.query("SELECT * FROM users WHERE active_trip = " + true + ";", function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            return response.json(result);
        });
    });
});


//////////// User Auth DB End ///////////////////////


//Postgres :: Insert new trip to the table of trips with data
app.post('/insertTrip', function (request, response) {

    console.log('SERVER:: Postgres:: insert new record to trips table with data');
    var jsonTrip = request.body;

    var cities = '{' + jsonTrip['username'].trip.cities + '}';
    var tripGeneral = jsonTrip['username'].trip.general;
    tripGeneral.continent = '{' + tripGeneral.continent + '}';

    console.log(tripGeneral.start_date);
    console.log(tripGeneral.end_date);

    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("INSERT INTO trips(trip_name, start_date, end_date, continent, cities, trip_description) values($1, $2, $3, $4, $5, $6)", [tripGeneral.trip_name, tripGeneral.start_date, tripGeneral.end_date, tripGeneral.continent, cities, tripGeneral.trip_description, false], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            //output: 1
        });
    });
    response.status(200).end();

});


//Postgres :: Insert new empty trip record to trips table
app.post('/insertNewEmptyTrip', function (request, response) {

    console.log('SERVER:: Postgres:: insert new empty record to trips table');

    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("INSERT INTO trips(trip_name) values($1) RETURNING id", //generate auto name
            [''],
            function (err, result) {
                //call `done()` to release the client back to the pool
                done();

                if (err) {
                    return console.error('error running query', err);
                }
                console.log(result);
                return response.json(result.rows[0].id);

                //output: 1
            });
    });
    // response.status(200).end();

});

//below used to create sample trip, for the new flow
app.post('/updateTripGeneralInfo', function (request, response) {

    console.log('SERVER:: Postgres:: update trip with General info' + request.body);

    var jsonTrip = request.body;
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("UPDATE trips SET trip_name = ($1), start_date = ($2), end_date =($3), trip_description = ($4), email = ($5), picture = ($6), continent = ($7), facebook_id = ($8), public = ($9), trip_type = ($10), cities = ($11) WHERE id = ($12)", [jsonTrip.trip_name, jsonTrip.start_date, jsonTrip.end_date, jsonTrip.trip_description, jsonTrip.email, jsonTrip.profile_picture, '{' + jsonTrip.continent + '}', jsonTrip.facebook_id, jsonTrip.options.trip_public, jsonTrip.trip_type, jsonTrip.cities, jsonTrip.trip_id], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            //output: 1
        });
    });
    response.status(200).end();
});

//below used to update trip from planning page
//Postgres :: update trip record to trips table
app.post('/updateTrip', function (request, response) {

    //var id = request.body.trip_id;
    // console.log('kariiiim'+id);
    console.log('SERVER:: Postgres:: update trip' + request.body);

    var jsonTrip = request.body;

    //var cities = '{'+jsonTrip['username'].trip.cities+'}';
    var table_plan = jsonTrip['username'].trip.table_plan;


    // example:: get city days :: jsonTrip['username'].trip.cities['days0']

    var tripGeneral = jsonTrip['username'].trip.general;
    tripGeneral.continent = '{' + tripGeneral.continent + '}';


    //    client.query("UPDATE items SET text=($1), complete=($2) WHERE id=($3)", [data.text, data.complete, id]);

    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("UPDATE trips SET trip_name = ($1), start_date = ($2), end_date =($3) , continent = ($4), table_plan = ($5), trip_description = ($6), email = ($7) WHERE id = ($8)", [tripGeneral.trip_name, tripGeneral.start_date, tripGeneral.end_date, tripGeneral.continent, table_plan, tripGeneral.trip_description, tripGeneral.email, tripGeneral.trip_id], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            //output: 1
        });
    });
    response.status(200).end();

});

//Postgres :: update active trip
app.post('/activateTrip', function (request, response) {

    console.log('SERVER:: Postgres:: update Trip if Active ' + request.body);

    var jsonTrip = request.body; // true or false

    //make sure all trips are not activated before active the trip (because only 1 trip should be activated at one time)
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("UPDATE trips SET active = ($1) WHERE email = ($2)", [false, request.body.email], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            //output: 1
        });
    });

    //update the Trip to be active
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("UPDATE trips SET active = ($1) WHERE id = ($2)", [true, request.body.trip_id], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            //output: 1
        });
    });
    response.status(200).end();

});

//postgres change track mode
app.post('/trackConfig', function (request, response) {

    console.log('SERVER:: Postgres:: config track mode ' + request.body);

    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        //by default track mode is false, means not real time, user need to update manually by click update button from the app
        client.query("UPDATE trips SET track_mode = ($1) WHERE id = ($2)", [request.body.track_mode, request.body.trip_id], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            //output: 1
        });
    });
    response.status(200).end();

});

//postgres public
app.post('/publicTrip', function (request, response) {

    console.log('SERVER:: Postgres:: public trip ' + request.body);

    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        //by default trip is not public
        client.query("UPDATE trips SET public = ($1) WHERE id = ($2)", [request.body.public, request.body.trip_id], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            //output: 1
        });
    });
    response.status(200).end();

});


//});
//save path
app.post('/savePathJsonPostgres', function (request, response) {
    console.log('SERVER:: Postgres:: save / update trip with path' + request.body);
    //var path = request.body;
    console.log(request.body);
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }//ARRAY[$${"hello": "world"}$$, $${"baz": "bing"}$$]::JSON[]
        client.query("UPDATE trips SET path = (path || $1) WHERE id = $2", [JSON.parse(request.body.path), request.body.tripid], function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log(result);
            //output: 1
        });
    });
    response.status(200).end();
});


//getPublicTrips
app.post('/getPublicTrips', function (request, response) {

    console.log('SERVER:: Postgres:: get all public trips');
    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return response.status(500).json({success: false, data: err});
        }
        //var email = "'" + request.body.email + "'";
        // SQL Query > Select Data
        var query = client.query("SELECT id, trip_name, start_date, end_date, continent, trip_description, cities_list, table_plan, email, active, track_mode, public, picture, photos_provider, facebook_id, trip_type, cities FROM trips WHERE public = true ORDER BY id DESC;");

        console.log(query);
        // Stream results back one row at a time
        query.on('row', function (row) {
            console.log(row);
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function () {
            done();
            return response.json(results);
        });
    });
});


//get My Trips id list - to help in showing the Dashboard for each trip
app.post('/getMyTripsId', function (request, response) {
    console.log('SERVER:: Postgres:: get all ids of My Trips');
    var id_list = [];
    console.log(request.body);
    // Get a Postgres client from the connection pool
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return response.status(500).json({success: false, data: err});
        }
        // SQL Query > Select Data
        var query = client.query("SELECT id FROM trips WHERE email = \'" + request.body.email + "\' ORDER BY id DESC  ;");

        console.log(query);
        // Stream results back one row at a time
        query.on('row', function (row) {
            console.log(row);
            id_list.push(row);
        });
        // After all data is returned, close connection and return results
        query.on('end', function () {
            done();
            return response.json(id_list);
        });
    });
});


//update trip photo provider in DB Postgres, by default it aws, could be Facebook, in the future will be also Instagram
app.post('/updateTripPhotosProvider', function (request, response) {

    console.log('SERVER:: Postgres:: update trip photos provider');
    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return response.status(500).json({success: false, data: err});
        }
        var query = client.query("UPDATE trips SET photos_provider = ($1) WHERE id = ($2)", [request.body.photos_provider, request.body.trip_id]);

        console.log(query);
        // Stream results back one row at a time
        query.on('row', function (row) {
            console.log(row);
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function () {
            done();
            return response.json(results);
        });

    });

});


//save facebook profile picture -- Not used, when create new trip I also update the profile picture in the same function
/*app.post('/saveProfilePicture', function (request, response) {

 console.log('SERVER:: Postgres:: save profile picture');
 var results = [];

 // Get a Postgres client from the connection pool
 pg.connect(conString, function (err, client, done) {
 // Handle connection errors
 if (err) {
 done();
 console.log(err);
 return response.status(500).json({success: false, data: err});
 }
 //var email = "'" + request.body.email + "'";
 // SQL Query > Select Data
 var query = client.query("UPDATE trips SET picture = ($1) WHERE id = ($2)",
 [jsonTrip.picture, jsonTrip.trip_id]);

 console.log(query);
 // Stream results back one row at a time
 query.on('row', function (row) {
 console.log(row);
 results.push(row);
 });

 // After all data is returned, close connection and return results
 query.on('end', function () {
 done();
 return response.json(results);
 });

 });

 });*/

//weather GPS points
var getXpointsFromPath = function (path_hash, points_number_per_day) {
    //  var d = Q.defer();
    var hash_weather_points = [];
    console.log('Required wetaher points: ' + points_number_per_day);
    for (var i = 0; i < path_hash.length; i++) {
        console.log('Day ' + i + ' of ' + path_hash.length);
        if (path_hash[i].length > 0) {
            hash_weather_points[i] = [];
            //get 5 points from each day
            //example: if day include 1000 points, and the required points per day is 5 then 1000 / 5 = 200, take point each 200 points.
            var points_between = path_hash[i].length / points_number_per_day;
            console.log('Ponits between: ' + points_between);
            for (var j = 0; j < points_number_per_day; j++) { //0 x 200, 1 x 200, 2 x 200, 3 x 200, 3 x 200, 4 x 200
                if (j > path_hash[i].length) {
                    console.log('break loop');
                    break;
                }

                if (j < path_hash[i].length) {
                    console.log('Point ' + j * points_between + ' :' + path_hash[i][j * points_between]);
                    hash_weather_points[i].push(path_hash[i][j * points_between]);
                } else {
                    console.log('Error: Calculating weather points exceeded array day length');
                }
            }
        } else {
            console.log('Path hash day ' + i + ' is empty');
        }
        if (i >= path_hash.length - 1) {
            console.log('KMMMOS');
            //d.resolve();
            //return d.promise;
        }
    }
};

//weather
var request = require('request');
app.post('/getWeather', function (req, res) {
    console.log('** Weather API started **')
    console.log(req.body);

    var path_hash = req.body.hash_path;
    var points_number_per_day = req.body.points_per_day;

    //Loop path and take 5 points from each day
    //for each point get the weather by
    // * cnt =  current date - point date
    // * lat and lng
    // save results in postgress with hashtable [day 1     ,    day 2    ,       day 3]
    //                                           [5 points]  [5 points]  [5 points]

    //before loop path, check if the path day have already the 5 points, else get the weather for the 5 points


    var hash_weather_points = [];
    console.log('Required wetaher points: ' + points_number_per_day);
    for (var i = 0; i < path_hash.length; i++) {
        console.log('Day ' + i + ' of ' + path_hash.length);
        if (path_hash[i].length > 0) {
            hash_weather_points[i] = [];
            //get 5 points from each day
            //example: if day include 1000 points, and the required points per day is 5 then 1000 / 5 = 200, take point each 200 points.
            var points_between = path_hash[i].length / points_number_per_day;
            console.log('Ponits between: ' + points_between);
            for (var j = 0; j < points_number_per_day; j++) { //0 x 200, 1 x 200, 2 x 200, 3 x 200, 3 x 200, 4 x 200
                if (j > path_hash[i].length) {
                    console.log('break loop');
                    break;
                }

                if (j < path_hash[i].length) {
                    console.log('Point ' + j * points_between + ' :' + path_hash[i][j * points_between]);
                    hash_weather_points[i].push(path_hash[i][j * points_between]);
                } else {
                    console.log('Error: Calculating weather points exceeded array day length');
                }
            }
        } else {
            console.log('Path hash day ' + i + ' is empty');
        }
        if (i >= path_hash.length - 1) {
            console.log('Looping weather points results to start get weather for each point');
            console.log(hash_weather_points);
            for(weather_hash_index = 0; weather_hash_index < hash_weather_points.length ; weather_hash_index++){
                for(index = 0; index < hash_weather_points[weather_hash_index] ; index++){

                    console.log(hash_weather_points[weather_hash_index][index]);


                    //Get weather
                    //api.openweathermap.org/data/2.5/forecast/daily?lat={lat}&lon={lon}&cnt={cnt}
                    //cnt number of days returned (from 1 to 16)

                    var key = 'c54b53573f2a9abe64b2694e1234e775';
                    let city = 'london';//req.body.city;
                    //let url = 'http://api.openweathermap.org/data/2.5/weather?q=London&units=imperial&appid=' + key;
                    let url = 'https://api.openweathermap.org/data/2.5/forecast/daily?lat=' + lat + '&lon=' + lon + '&cnt=' + cnt + '&appid=' + key;
                    request(url, function (err, response, body) {
                        console.log(body);
                        if (err) {
                            console.log('weather API error: please try again');
                        } else {
                            let weather = JSON.parse(body)
                            if (weather.main == undefined) {
                                console.log('weather API: null, error: Error, please try again');
                            } else {
                                let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}!`;
                                console.log('Weather result: ' + weatherText);
                            }
                        }
                    });


                }
            }
        }
    }


    //getXpointsFromPath(req.body.hash_path, req.body.points_per_day).then(function (results) {

    //});
});


//Postgres read trips table
app.post('/getMyTrips', function (request, response, next) {
    // add validation to the email is valid - add function to do the validation
    //else return nothing
    if (request.body.email == '') {
        response.status(200);
    } else {
        console.log('SERVER:: Postgres:: get all trip from trips by user email');
        console.log(request.body.email);
        var results = [];
        // Get a Postgres client from the connection pool
        pg.connect(conString, function (err, client, done) {
            // Handle connection errors
            if (err) {
                done();
                console.log(err);
                return response.status(500).json({success: false, data: err});
            }
            //var email = "'" + request.body.email + "'";
            // SQL Query > Select Data
            var query = client.query("SELECT id, trip_name, start_date, end_date, continent, trip_description, cities_list, table_plan, email, active, track_mode, public, picture, photos_provider, facebook_id, trip_type, cities FROM trips WHERE email = \'" + request.body.email + "\' ORDER BY id DESC  ;");

            console.log(query);
            // Stream results back one row at a time
            query.on('row', function (row) {
                console.log(row);
                results.push(row);
            });

            // After all data is returned, close connection and return results
            query.on('end', function () {
                done();
                return response.json(results);
            });

        });
    }
});

//Postgres get trip by id
app.post('/getTripById', function (request, response) {

    if (request.body.trip_id) {
        console.log('SERVER:: Postgres:: get trip by id :: trip id ::' + request.body.trip_id);
        var trip_id = request.body.trip_id;
        var results = [];

        // Get a Postgres client from the connection pool
        pg.connect(conString, function (err, client, done) {
            // Handle connection errors
            if (err) {
                done();
                console.log(err);
                return response.status(500).json({success: false, data: err});
            }

            // SQL Query > Select Data
            var query = client.query("SELECT * FROM trips WHERE id = " + trip_id + ";");

            // Stream results back one row at a time
            query.on('row', function (row) {
                results.push(row);
            });

            // After all data is returned, close connection and return results
            query.on('end', function () {
                done();
                console.log(results); // looks like : [{....}]
                //tripById = results;
                tripById = results; //save instance of the trip to be used in other places, like get the date while creating the table
                return response.json(results);
            });
        });
    } else {
        console.log('error:: SERVER:: Postgres:: get trip by id :: trip id :: No trip id');
    }
});


app.post('/uploadPhotos', function (req, res) {
    console.log('LOG:: Upload photos to AWS S3');

    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {

        console.log(fields);

        var data = JSON.parse(fields.data[0]);
        var userid = data.userid;
        var tripid = data.tripid;


        for (var key in files) {
            if (files.hasOwnProperty(key)) {
                var fileName = fields[files[key][0].fieldName][0];
                var newPath = process.cwd() + '/temp/uploads/' + fileName; //add user id
                readAndWriteFile(files[key][0], newPath, userid, tripid, fileName);
            }
        }
    });

    function readAndWriteFile(singleImg, newPath, userid, tripid, filename) {

        fs.readFile(singleImg.path, function (err, data) {
            fs.writeFile(newPath, data, function (err) {
                if (err) console.log('Error ReadWrite image!! :' + err);
                console.log('File saved (local): ' + singleImg.fieldName + ' - ' + newPath);

                //upload to S3
                console.log('upload to S3');


                // For dev purposes only
                AWS.config.update({
                    accessKeyId: 'AKIAIGEOPTU4KRW6GK6Q',
                    secretAccessKey: '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'
                });

                // Read in the file, convert it to base64, store to S3
                fs.readFile(newPath, function (err, data) {
                    if (err) {
                        throw err;
                    }

                    var base64data = new Buffer(data, 'binary');

                    var s3 = new AWS.S3();
                    console.log(userid);
                    console.log(tripid);
                    // call S3 to retrieve upload file to specified bucket
                    var uploadParams = {
                        Bucket: 'tracker.photos',
                        Key: userid + '/' + tripid + '/' + filename,
                        Body: base64data,
                        ACL: 'public-read'
                    };

                    var file = newPath;

                    var fileStream = fs.createReadStream(file);
                    fileStream.on('error', function (err) {
                        console.log('File Error', err);
                    });
                    uploadParams.Body = fileStream;

                    // var path = require('path');
                    //uploadParams.Key = path.basename(file);

                    // call S3 to retrieve upload file to specified bucket
                    s3.upload(uploadParams, function (err, data) {
                        if (err) {
                            console.log("Error", err);
                        }
                        if (data) {
                            console.log("Upload Success", data.Location);
                        }
                    });
                })
            })
        })
    }
});
//Postgres Delete trip by id
app.post('/deleteTripById', function (request, response) {

    console.log('SERVER:: Postgres:: delete trip by id :: trip id ::' + request.body.trip_id);
    var trip_id = request.body.trip_id;
    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return response.status(500).json({success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("DELETE FROM trips WHERE id = " + trip_id + ";");

        // Stream results back one row at a time
        //   query.on('row', function(row) {
        //     results.push(row);
        //  });

        // After all data is returned, close connection and return results
        query.on('end', function () {
            done();
            console.log(results); // looks like : [{....}]
            //  tripById = results;
            return response.json(results);
        });

    });
});


/*
 //Create trip table
 app.post('/createTable', function (request, response) {
 var table = [];
 var start_date = '';

 console.log('SERVER:: Postgres:: Create trip table');
 var trip_id = request.body.trip_id;
 var results = [];

 pg.connect(conString, function (err, client, done) {
 // Handle connection errors
 if (err) {
 done();
 console.log(err);
 return response.status(500).json({success: false, data: err});
 }

 // SQL Query > Select Data
 var query = client.query("SELECT table_plan FROM trips WHERE id = " + trip_id + ";");

 // Stream results back one row at a time
 query.on('row', function (row) {
 results.push(row);
 });

 // After all data is returned, close connection and return results
 query.on('end', function () {
 done();
 console.log('table plan');
 console.log(results[0].table_plan); // looks like : [{....}]
 jsonTable = results;

 //create array of cities and days, if London have 2 days then 2 cells will be added to the array showing the city name and the day number
 var dayNumber = 0;
 //create Json Table
 if (results[0].table_plan) {
 for (var i = 0; i < results[0].table_plan.length; i++) {
 for (var j = 0; j < results[0].table_plan[i]['days' + i]; j++) {
 dayNumber++;
 var day = {
 date: tripById[0].start_date,
 day: dayNumber,
 city: results[0].table_plan[i]['city' + i],
 flight: {flight: false, price: 0},
 car: '',
 action1: '',
 action2: ''
 };

 table.push(day);

 day = '';
 }
 }
 console.log('SERVER:: Create JSON table:: ' + table);
 return response.json(table);
 }
 });
 });
 });
 */

//get last trip id from the trips table
app.post('/getLastTripId', function (request, response) {
    console.log('SERVER: get last trip id from trips table');

    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("SELECT * limit 1", function (err, result) {
            //call `done()` to release the client back to the pool
            done();

            if (err) {
                return console.error('error running query', err);
            }
            console.log('SERVER: last trip id: ' + result);
            //output: 1
        });
    });
    response.status(200).end();
});


app.listen(port);
console.log("App listening on port " + port);


////// Google maps /////////
var geocoderProvider = 'google';
var httpAdapter = 'https';
// optionnal
var extra = {
    apiKey: 'AIzaSyBgSxdli3zXpI3dPtFR9H0fbVZIcSZOvyo', // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);


//////////////////////// DB /////////////////////////////////////////////////

//receive country and city name, return GeoCode from Google Maps API
app.post('/getGeoCode', function (request, response) {
    // Using callback
    console.log('Server::: Get GeoCode for city::' + request.body); // print the city name from UI
    console.log('Server city name ' + request.body.city);
    geocoder.geocode(request.body.city, function (err, res) {
        //  console.log(err,res); //print the response from GeoLocation google API
        response.send(res);
    });

});
//////////////////////////////////////////////////DB end ////////////////////////////////////


////////////////////////////////////////////////// DropBox part ///////////////////////////


/*

 // Server-side applications use both the API key and secret.
 var client = new Dropbox.Client({
 key: config.dropbox.key,
 secret: config.dropbox.secret,
 sandbox: false,
 token: config.dropbox.token,
 tokenSecret: config.dropbox.token.secret
 });

 client.getAccountInfo(function (error, accountInfo) {
 if (error) {
 console.log(error);
 //return showError(error);  // Something went wrong.
 } else console.log("Hello from DropBox, " + accountInfo.name + "!");
 });

 */

/*
 client.writeFile("hello_world.txt", "Hello, world!\n", function(error, stat) {
 if (error) {
 // return showError(error);  // Something went wrong.
 }

 console.log("File saved as revision " + stat.versionTag);
 });*/


// Get GPS XML from DropBox -> Parse to JSON -> Send to client

//get GPS from DropBox and send to client:
app.post('/getGpsPoints', function (request, response) {
    console.log("Server: get GPS points");

    client.readFile("20150904.gpx", function (error, data) {
        if (error) {
            console.log(error);
            //return showError(error);  // Something went wrong.
        }


        // console.log('got data: '+data);

        var parseString = require('xml2js').parseString;
        var xml = data;
        parseString(xml, function (err, result) {
            //console.log(result);
            var gpsJson = result;
            //Ponts data : gpsJson.gpx.trk[0].trkseg[0].trkpt
            //Point :: gpsJson.gpx.trk[0].trkseg[0].trkpt[2]['$'] ... { lat: '37.422005', lon: '-422.08409333333327' }
            //console.log(gpsJson.gpx.trk[0].trkseg[0].trkpt);

            var points = gpsJson.gpx.trk[0].trkseg[0].trkpt;

            var pointsJson = [{id: 1, path: []}];

            for (var i = 0; i < points.length; i++) {
                //console.log(points[i]['$'].lat);
                // console.log(points[i]['$'].lon);
                pointsJson[0].path.push({latitude: points[i]['$'].lat, longitude: points[i]['$'].lon});
            }

            //   console.log(gpsJson.gpx.trk[0].trkseg[0]);
            response.send(pointsJson[0]);
        });
        // console.log(data);  // data has the file's contents
    });

    /////////////////// DropBox end //////////////////////////

});


// ################### FireBase - GPS Points from mobile device ############################## //
/*
 //this code should be used to listen for an change in FireBase, when add new GPS point then to push a notification to the client
 FirebaseRef.on('child_added', function(childSnapshot, prevChildKey) {
 // code to handle new child.
 });
 */
app.post('/getGpsTrack', function (request, response) {
    FirebaseRef.on("value", function (snapshot) {
        //console.log(snapshot.val());
        response.send(snapshot.val());
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
});

io.on('connection', function (socket) {
    console.log('New socket id: ' + socket.id);
    sockets.push(socket);
});

//When new GPS point added - Listener
FirebaseRef.endAt().limitToLast(1).on('child_added', function (childSnapshot, prevChildKey) {
    console.log('new GPS point added ' + childSnapshot.val());
    //sendGpsPointToClient(childSnapshot.val());

    for (var i = 0; i < sockets.length; ++i) {
        console.log('Socket' + sockets[i]);
        socket = sockets[i];
        socket.volatile.emit('GpsPoint', childSnapshot.val());
    }
});

function sendGpsPointToClient(GpsPoint) {
    console.log('STAM');
    io.on('connection', function (socket) {
        console.log('new GPS point added 2' + GpsPoint);
        socket.emit('GpsPoint', GpsPoint);

        socket.on('my other event', function (data) {
            console.log(data);
        });
    });


}

// #############################   End Firebase    ############################ //


// ################### SITA           ############################## //
//https://www.developer.aero/Airport-API/Try-it-Now
// key1 :: f1aeb34aba3d0613f7cbb81cfd4b9d09
// key2 :: 76011c36815e36733d4e83188a46c369

//by using this API I can find the X airports close to the lat, long point I will pass to the API.

app.post('/getNearestAirports', function (request, response) {
    //curl -v  -X GET "https://airport.api.aero/airport/nearest/31.0461/34.8516?maxAirports=4&user_key=f1aeb34aba3d0613f7cbb81cfd4b9d09"

    var http = require('https'); // get it to the top

    //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
    var options = {
        host: 'airport.api.aero',
        path: '/airport/nearest/' + request.body.lat + '/' + request.body.lng + '?maxAirports=' + request.body.maxAirports + '&user_key=f1aeb34aba3d0613f7cbb81cfd4b9d09',
        headers: {'accept': 'application/xml'}
    };

    callback = function (res) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        res.on('data', function (chunk) {
            str += chunk;
            console.log(str);
        });

        //the whole response has been recieved, so we just print it out here
        res.on('end', function () {


            //convert the response from XML to JSON
            var parseString = require('xml2js').parseString;
            parseString(str, function (err, result) {
                console.log(JSON.stringify(result));
                response.send(JSON.stringify(result));
            });


        });
    }

    http.request(options, callback).end();


});


//################### End SITA        ############################## //


// ################### Google Flights ############################## //

app.post('/getFlights', function (request, response) {
    //Google flights API
    var flightParam = request.body; // {origin:"TLV", destination:"JFK", date:"2015-12-02", solutions: 10};

    // create http request client to consume the QPX API
    var request = require("request");

    // JSON to be passed to the QPX Express API
    var requestData = {
        "request": {
            "slice": [{
                "origin": flightParam.origin,
                "destination": flightParam.destination,
                "date": flightParam.date
            }],
            "passengers": {
                "adultCount": 1,
                "infantInLapCount": 0,
                "infantInSeatCount": 0,
                "childCount": 0,
                "seniorCount": 0
            },
            "solutions": flightParam.solutions,
            "refundable": false
        }
    }

    console.log(flightParam);

    // QPX REST API URL
    url = "https://www.googleapis.com/qpxExpress/v1/trips/search?key=AIzaSyBgSxdli3zXpI3dPtFR9H0fbVZIcSZOvyo"

    // fire request
    /*
     request({
     url: url,
     method: "POST",
     json: requestData

     }, function (error, res, body) {
     if (!error && res.statusCode === 200) {
     console.log(body);
     response.send(body);
     }
     else {

     console.log("error: " + error);
     console.log("response.statusCode: " + response.statusCode);
     console.log("response.statusText: " + response.statusText);

     }
     })
     */

    response.send(tmp);
});
