// set up ======================================================================
var express  = require('express');
var app      = express(); 								// create our app w/ express
var port  	 = process.env.PORT || 9090; 
//var mongoose = require('mongoose'); 					// mongoose for mongodb				// set the port
var database = require('./config/database'); 			// load the database config
var Firebase = require("firebase");                     //Firebase cloud Database No Sql

var morgan = require('morgan'); 		// log requests to the console (express4)
var bodyParser = require('body-parser'); 	// pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var myFirebaseRef = new Firebase("https://luminous-torch-9364.firebaseio.com/"); //Firebase DB connection 

// configuration ===============================================================
//mongoose.connect(database.url); 	// connect to mongoDB database on modulus.io

app.use(express.static(__dirname + '/public')); 				// set static path
app.use(morgan('dev')); 										// log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'})); 			// parse application/x-www-form-urlencoded
app.use(bodyParser.json()); 									// parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

// routes 
require('./app/routes.js')(app);

//post - receive trip details

app.post('/postTrip', function(request, response){
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
app.post('/getGeoCode', function(request, response){
// Using callback
//console.log(Server: request.body.city); // print the city name from UI

	geocoder.geocode(request.body.city, function(err, res) {
  	//  console.log(err,res); //print the response from GeoLocation google API
  	  response.send(res);
	});

});



//get last trip id from DB
app.post('/getLastTripId', function(request, response){
  var lastTripId = '';
  myFirebaseRef.endAt().limitToLast(1).on("child_added", function(snapshot) {
          console.log("Server: Last trip id: "+snapshot.val().trip_id);
          lastTripId = snapshot.val().trip_id;
        });
  response.send(lastTripId); 
});

//save cities list to Firbase:
app.post('/saveCities', function(request, response){
  console.log(request.body);      // your JSON
  var citiesJson = request.body;


  var jsonAllData = { 
        trip_id: "100",
        general:{
        trip_name: "Iceland",
        start_date: "15/09/2015",
        end_date: "15/09/2015"
      }
    }

     jsonAllData["cities"] = citiesJson;
     console.log(jsonAllData);

    myFirebaseRef.push(jsonAllData);


  //response.status(200).end();    // echo the result back - should be changed, validation required
});