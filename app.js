// set up ======================================================================
var express = require('express');
var app = express(); 								// create our app w/ express
var port = process.env.PORT || 9090;
//var mongoose = require('mongoose'); 					// mongoose for mongodb				// set the port
//var database = require('./config/database'); 			// load the database config
var Firebase = require("firebase");                     //Firebase cloud Database No Sql

//PostgresSQL
//var dbOperations = require("./dbOperations.js");
//var pg = require('pg');
//var conString = "postgres://postgres:789852@localhost/database"; should be saved as Env variable 


var morgan = require('morgan'); 		// log requests to the console (express4)
var bodyParser = require('body-parser'); 	// pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var myFirebaseRef = new Firebase("https://luminous-torch-9364.firebaseio.com/"); //Firebase DB connection 

// configuration ===============================================================
//mongoose.connect(database.url); 	// connect to mongoDB database on modulus.io

app.use(express.static(__dirname + '/public')); 				// set static path
app.use(morgan('dev')); 										// log every request to the console
app.use(bodyParser.urlencoded({'extended': 'true'})); 			// parse application/x-www-form-urlencoded
app.use(bodyParser.json()); 									// parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride());

// routes 
require('./app/routes.js')(app);

//post - receive trip details

app.post('/postTrip', function (request, response) {
    console.log(request.body);      // your JSON

    myFirebaseRef.set({
        name: request.body.name,
        email: request.body.email,
        message: request.body.message
    });

    response.status(200).end();    // echo the result back
});

app.listen(port);
console.log("App listening on port " + port);


////// Google maps /////////
var geocoderProvider = 'google';
var httpAdapter = 'https';
// optionnal
var extra = {
    apiKey: 'AIzaSyBgSxdli3zXpI3dPtFR9H0fbVZIcSZOvyo', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = require('/Users/fanadka/AppData/Roaming/npm/node_modules/node-geocoder')(geocoderProvider, httpAdapter, extra);


//post - receive country and city name, return GeoCode from Google Maps API
app.post('/getGeoCode', function (request, response) {
// Using callback
//console.log(Server: request.body.city); // print the city name from UI
    console.log('Server city name ' +request.body);
    geocoder.geocode(request.body, function (err, res) {
        //  console.log(err,res); //print the response from GeoLocation google API
        response.send(res);
    });

});


//get last trip id from DB
app.post('/getLastTripId', function (request, response) {
    var lastTripId = '0';
    myFirebaseRef.endAt().limitToLast(1).on("child_added", function (snapshot) {
        lastTripId = snapshot.val().trip_id;
        console.log("Server: Last trip id: " + lastTripId);
        response.send(lastTripId);
    });

});

//save Trip to DB:
app.post('/saveTrip', function (request, response) {
    var jsonTrip = request.body;
    var onComplete = function (error) {
        if (error) {
            console.log('Trip object failed to be saved in DB -> ' + JSON.stringify(jsonTrip));
            response.send('Trip object failed to be saved in DB ').end();
        } else {
            console.log('Trip object saved in DB -> ' + JSON.stringify(jsonTrip));
            response.send('Trip object saved in DB -> '+JSON.stringify(jsonTrip)).end();
        }
    };
    myFirebaseRef.set(jsonTrip, onComplete);
// Same as the previous example, except we will also log a message
// when the data has finished synchronizing


    // echo the result back - should be changed, validation required
});

//Retrieving Trip to DB:
app.post('/getTrip', function (request, response) {
    console.log("Server: Retrieving Trip data from DB");


    myFirebaseRef.on("value", function (snapshot) {
        console.log('Server: Trip object retrieving from DB succeeded -> ' + JSON.stringify(snapshot.val()));

        response.json(snapshot.val()); //send retried object to client

    }, function (errorObject) {
        console.log('Server: Trip object retrieving from DB failed -> ' + errorObject.code);

        //response.send('Server: Trip object retrieving from DB failed -> ' + errorObject.code);
    });
});