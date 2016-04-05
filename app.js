// set up ======================================================================
//                    @@@ Karim Fanadka @@
//   ** Be the agent of your self, plan, execute and share **
//
//
// #############################################################################


// Google API's
// Google flights : 764755235403-acq12nfulcu93pilc1fa189mu7f4h1mb.apps.googleusercontent.com
// Google flights : hqYL2H9wJK2pqN92XYYPhiv2
// Google maps  : AIzaSyBgSxdli3zXpI3dPtFR9H0fbVZIcSZOvyo

var http = require('http');


var express = require('express');
var app = express(); 								// create our app w/ express
var port = process.env.PORT || 9090;
var server = http.createServer(app);


var io = require('socket.io').listen(server);

server.listen(8080);


//var mongoose = require('mongoose'); 					// mongoose for mongodb				// set the port
//var database = require('./config/database'); 			// load the database config
var Firebase = require("firebase");                     //Firebase cloud Database No Sql

var Dropbox = require("dropbox");                       //dropbox - to get the files of GPS, XML format

//PostgresSQL
var pg = require('pg');
//var conString = "postgres://postgres:789852@localhost/database"; //should be saved as Env variable


var conString = "pg://karim:1234@localhost:5432/karim";
var client = new pg.Client(conString);
//client.connect();


var config = require('./config');                       //general config, passwords, accounts, etc

var morgan = require('morgan'); 		// log requests to the console (express4)
var bodyParser = require('body-parser'); 	// pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)

//FireBase DB
var FirebaseRef = new Firebase("https://luminous-torch-9364.firebaseio.com/"); //Firebase DB connection

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


////################# Sabre Services Config ended #############################
// General variables
var tripById = '';
var sockets = [];
/////////////////////

//#####################################################
//# Rest Calls                                       #
//####################################################
//REST calls for Postgres DB


//////////// User Auth DB  ///////////////////////

//Postgres :: Check if user exists
app.post('/checkUserExistsByEmail', function (request, response) {

    console.log('SERVER:: Postgres::  Check if user exists by email');
    pg.connect(conString, function (err, client, done) {
        // Handle connection errors
        if (err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
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
        var query = client.query("INSERT INTO users(email, name, provider, provider_id, cell_number, active_trip) values($1, $2, $3, $4, $5, $6)",
            [request.body.email, request.body.name, 'facebook', request.body.id, '0500000000', true], function (err, result) {
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
        client.query("INSERT INTO trips(trip_name, start_date, end_date, continent, cities, trip_description) values($1, $2, $3, $4, $5, $6)",
            [tripGeneral.trip_name, tripGeneral.start_date, tripGeneral.end_date, tripGeneral.continent, cities, tripGeneral.trip_description], function (err, result) {
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
            [''], function (err, result) {
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
        client.query("UPDATE trips SET trip_name = ($1), start_date = ($2), end_date =($3) , continent = ($4), table_plan = ($5), trip_description = ($6), email = ($7) WHERE id = ($8)",
            [tripGeneral.trip_name, tripGeneral.start_date, tripGeneral.end_date, tripGeneral.continent, table_plan, tripGeneral.trip_description,tripGeneral.email ,tripGeneral.trip_id]
            , function (err, result) {
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

//Postgres read trips table
app.post('/getTrips', function (request, response) {

    // add validation to the email is valid - add function to do the validation
    //else return nothing


    if (request.body.email == '') {
        response.status(200);
    } else {
        console.log('SERVER:: Postgres:: get all trip from trips table by user email');
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
            var query = client.query("SELECT * FROM trips WHERE email = \'" + request.body.email + "\' ORDER BY id ASC  ;");

            // Stream results back one row at a time
            query.on('row', function (row) {
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
    formatter: null         // 'gpx', 'string', ...
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

app.post('/getNearestAirports', function (request, response){
//curl -v  -X GET "https://airport.api.aero/airport/nearest/31.0461/34.8516?maxAirports=4&user_key=f1aeb34aba3d0613f7cbb81cfd4b9d09"

    var http = require('https'); // get it to the top

//The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
    var options = {
        host: 'airport.api.aero',
        path: '/airport/nearest/31.0461/34.8516?maxAirports=1&user_key=f1aeb34aba3d0613f7cbb81cfd4b9d09'
    };

    callback = function(res) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        res.on('data', function (chunk) {
            str += chunk;
            console.log(str);
        });

        //the whole response has been recieved, so we just print it out here
        res.on('end', function () {
            console.log(str);
            response.send(str);
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
            "slice": [
                {
                    "origin": flightParam.origin,
                    "destination": flightParam.destination,
                    "date": flightParam.date
                }
            ],
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
     //response.send(body);
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


var tmp = {
    "kind": "qpxExpress#tripsSearch",
    "trips": {
        "kind": "qpxexpress#tripOptions",
        "requestId": "Ht8uACtWvM0nHmFKD0NS5w",
        "data": {
            "kind": "qpxexpress#data",
            "airport": [
                {
                    "kind": "qpxexpress#airportData",
                    "code": "AMS",
                    "city": "AMS",
                    "name": "Amsterdam Schiphol Airport"
                },
                {
                    "kind": "qpxexpress#airportData",
                    "code": "BCN",
                    "city": "BCN",
                    "name": "Barcelona"
                },
                {
                    "kind": "qpxexpress#airportData",
                    "code": "IST",
                    "city": "IST",
                    "name": "Istanbul Ataturk"
                },
                {
                    "kind": "qpxexpress#airportData",
                    "code": "LHR",
                    "city": "LON",
                    "name": "London Heathrow"
                },
                {
                    "kind": "qpxexpress#airportData",
                    "code": "TLV",
                    "city": "TLV",
                    "name": "Tel Aviv-Yafo Ben Gurion International"
                },
                {
                    "kind": "qpxexpress#airportData",
                    "code": "TXL",
                    "city": "BER",
                    "name": "Berlin Tegel"
                }
            ],
            "city": [
                {
                    "kind": "qpxexpress#cityData",
                    "code": "AMS",
                    "name": "Amsterdam"
                },
                {
                    "kind": "qpxexpress#cityData",
                    "code": "BCN",
                    "name": "Barcelona"
                },
                {
                    "kind": "qpxexpress#cityData",
                    "code": "BER",
                    "name": "Berlin"
                },
                {
                    "kind": "qpxexpress#cityData",
                    "code": "IST",
                    "name": "Istanbul"
                },
                {
                    "kind": "qpxexpress#cityData",
                    "code": "LON",
                    "name": "London"
                },
                {
                    "kind": "qpxexpress#cityData",
                    "code": "TLV",
                    "name": "Tel Aviv"
                }
            ],
            "aircraft": [
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "320",
                    "name": "Airbus A320"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "321",
                    "name": "Airbus A321"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "32A",
                    "name": "Airbus A320"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "32B",
                    "name": "Airbus A321 (Sharklets)"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "333",
                    "name": "Airbus A330"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "738",
                    "name": "Boeing 737"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "73H",
                    "name": "Boeing 737"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "73J",
                    "name": "Boeing 737"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "73W",
                    "name": "Boeing 737"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "744",
                    "name": "Boeing 747"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "772",
                    "name": "Boeing 777"
                },
                {
                    "kind": "qpxexpress#aircraftData",
                    "code": "E90",
                    "name": "Embraer RJ-190"
                }
            ],
            "tax": [
                {
                    "kind": "qpxexpress#taxData",
                    "id": "OG_001",
                    "name": "Spain Aviation Safety And Security Fee"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "YR_F",
                    "name": "TK YR surcharge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "YR_I",
                    "name": "IB YR surcharge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "CJ_001",
                    "name": "Netherlands Security Service Charge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "RN_001",
                    "name": "The Netherlands Passenger Service Charge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "YQ_I",
                    "name": "IB YQ surcharge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "UB",
                    "name": "United Kingdom Passenger Service Charge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "RA_002",
                    "name": "German Passenger Service Charge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "DE_001",
                    "name": "Germany Airport Security Charge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "TR_001",
                    "name": "Turkey Airport Service Charge International"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "YQ_F",
                    "name": "AB YQ surcharge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "QV_001",
                    "name": "Spain Security Tax"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "VV_001",
                    "name": "Netherlands Noise Surcharge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "GB_001",
                    "name": "United Kingdom Air Passengers Duty"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "JD_001",
                    "name": "Spain Departure Charge"
                },
                {
                    "kind": "qpxexpress#taxData",
                    "id": "AP_001",
                    "name": "Israeli Security and Insurance Surcharge"
                }
            ],
            "carrier": [
                {
                    "kind": "qpxexpress#carrierData",
                    "code": "AB",
                    "name": "Air Berlin PLC & Co. Luftverkehrs KG"
                },
                {
                    "kind": "qpxexpress#carrierData",
                    "code": "IB",
                    "name": "Iberia Lineas Aereas de Espana S.A."
                },
                {
                    "kind": "qpxexpress#carrierData",
                    "code": "KL",
                    "name": "KLM Royal Dutch Airlines"
                },
                {
                    "kind": "qpxexpress#carrierData",
                    "code": "LY",
                    "name": "El Al Israel Airlines Ltd."
                },
                {
                    "kind": "qpxexpress#carrierData",
                    "code": "TK",
                    "name": "Turkish Airlines Inc."
                }
            ]
        },
        "tripOption": [
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP236.81",
                "id": "ag85lXmWFfSUXxgd9kLMxI006",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 880,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 135,
                                "flight": {
                                    "carrier": "IB",
                                    "number": "5103"
                                },
                                "id": "GCrYi1glAMWowOu9",
                                "cabin": "COACH",
                                "bookingCode": "Q",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LI99FE4pz9JQHIVr",
                                        "aircraft": "320",
                                        "arrivalTime": "2015-12-30T15:40+01:00",
                                        "departureTime": "2015-12-30T12:25+00:00",
                                        "origin": "LHR",
                                        "destination": "BCN",
                                        "originTerminal": "3",
                                        "destinationTerminal": "1",
                                        "duration": 135,
                                        "operatingDisclosure": "OPERATED BY VUELING AIRLINES",
                                        "mileage": 713,
                                        "meal": "Food and Beverages for Purchase"
                                    }
                                ],
                                "connectionDuration": 495
                            },
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 250,
                                "flight": {
                                    "carrier": "IB",
                                    "number": "5918"
                                },
                                "id": "GtD7Yh9zh8uEt46g",
                                "cabin": "COACH",
                                "bookingCode": "Q",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LmwavtNtjBw65LQn",
                                        "aircraft": "320",
                                        "arrivalTime": "2015-12-31T05:05+02:00",
                                        "departureTime": "2015-12-30T23:55+01:00",
                                        "origin": "BCN",
                                        "destination": "TLV",
                                        "originTerminal": "1",
                                        "destinationTerminal": "3",
                                        "duration": 250,
                                        "operatingDisclosure": "OPERATED BY VUELING AIRLINES",
                                        "mileage": 1913,
                                        "meal": "Food and Beverages for Purchase"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "ANba1BKUYNtv2o5RM0xT2W7NORKsqEke5nsBAoKslf0nO8irXDgY/QxJc6VrZVjDzO9mwSZ+uYD/8U4HZd/jrpkWSn5YLwU",
                                "carrier": "IB",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "QWYNVY"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "ANba1BKUYNtv2o5RM0xT2W7NORKsqEke5nsBAoKslf0nO8irXDgY/QxJc6VrZVjDzO9mwSZ+uYD/8U4HZd/jrpkWSn5YLwU",
                                "segmentId": "GtD7Yh9zh8uEt46g"
                            },
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "ANba1BKUYNtv2o5RM0xT2W7NORKsqEke5nsBAoKslf0nO8irXDgY/QxJc6VrZVjDzO9mwSZ+uYD/8U4HZd/jrpkWSn5YLwU",
                                "segmentId": "GCrYi1glAMWowOu9"
                            }
                        ],
                        "baseFareTotal": "GBP100.00",
                        "saleFareTotal": "GBP100.00",
                        "saleTaxTotal": "GBP136.81",
                        "saleTotal": "GBP236.81",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "JD_001",
                                "chargeType": "GOVERNMENT",
                                "code": "JD",
                                "country": "ES",
                                "salePrice": "GBP8.90"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "QV_001",
                                "chargeType": "GOVERNMENT",
                                "code": "QV",
                                "country": "ES",
                                "salePrice": "GBP1.80"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "OG_001",
                                "chargeType": "GOVERNMENT",
                                "code": "OG",
                                "country": "ES",
                                "salePrice": "GBP0.40"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "YQ_I",
                                "chargeType": "CARRIER_SURCHARGE",
                                "code": "YQ",
                                "salePrice": "GBP23.90"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP30.11"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "YR_I",
                                "chargeType": "CARRIER_SURCHARGE",
                                "code": "YR",
                                "salePrice": "GBP0.70"
                            }
                        ],
                        "fareCalculation": "LON IB X/BCN IB TLV 153.62QWYNVY NUC 153.62 END ROE 0.652504 FARE GBP 100.00 XT 71.00GB 30.11UB 8.90JD 0.40OG 1.80QV 23.90YQ 0.70YR",
                        "latestTicketingTime": "2015-12-21T19:04-05:00",
                        "ptc": "ADT"
                    }
                ]
            },
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP275.01",
                "id": "ag85lXmWFfSUXxgd9kLMxI002",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 615,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 75,
                                "flight": {
                                    "carrier": "KL",
                                    "number": "1012"
                                },
                                "id": "GGlF2awkY9VqThqq",
                                "cabin": "COACH",
                                "bookingCode": "L",
                                "bookingCodeCount": 5,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LkHZkA4NRmPaFXN7",
                                        "aircraft": "E90",
                                        "arrivalTime": "2015-12-30T16:20+01:00",
                                        "departureTime": "2015-12-30T14:05+00:00",
                                        "origin": "LHR",
                                        "destination": "AMS",
                                        "originTerminal": "4",
                                        "duration": 75,
                                        "operatingDisclosure": "OPERATED BY KLM CITYHOPPER",
                                        "mileage": 229,
                                        "meal": "Snack or Brunch"
                                    }
                                ],
                                "connectionDuration": 270
                            },
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 270,
                                "flight": {
                                    "carrier": "KL",
                                    "number": "461"
                                },
                                "id": "GV8SB-BN7hExm8hM",
                                "cabin": "COACH",
                                "bookingCode": "L",
                                "bookingCodeCount": 5,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "Ld-AOaKElGYymRse",
                                        "aircraft": "73J",
                                        "arrivalTime": "2015-12-31T02:20+02:00",
                                        "departureTime": "2015-12-30T20:50+01:00",
                                        "origin": "AMS",
                                        "destination": "TLV",
                                        "destinationTerminal": "3",
                                        "duration": 270,
                                        "mileage": 2057,
                                        "meal": "Meal"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                                "carrier": "KL",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "L7WKWGB3"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                                "segmentId": "GV8SB-BN7hExm8hM"
                            },
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                                "segmentId": "GGlF2awkY9VqThqq"
                            }
                        ],
                        "baseFareTotal": "GBP164.00",
                        "saleFareTotal": "GBP164.00",
                        "saleTaxTotal": "GBP111.01",
                        "saleTotal": "GBP275.01",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP30.11"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "CJ_001",
                                "chargeType": "GOVERNMENT",
                                "code": "CJ",
                                "country": "NL",
                                "salePrice": "GBP4.90"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "VV_001",
                                "chargeType": "GOVERNMENT",
                                "code": "VV",
                                "country": "NL",
                                "salePrice": "GBP0.40"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "RN_001",
                                "chargeType": "GOVERNMENT",
                                "code": "RN",
                                "country": "NL",
                                "salePrice": "GBP4.60"
                            }
                        ],
                        "fareCalculation": "LON KL X/AMS KL TLV 251.33L7WKWGB3 NUC 251.33 END ROE 0.652504 FARE GBP 164.00 XT 71.00GB 30.11UB 4.90CJ 4.60RN 0.40VV",
                        "latestTicketingTime": "2015-12-21T19:04-05:00",
                        "ptc": "ADT"
                    }
                ]
            },
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP275.01",
                "id": "ag85lXmWFfSUXxgd9kLMxI008",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 860,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 85,
                                "flight": {
                                    "carrier": "KL",
                                    "number": "1008"
                                },
                                "id": "GaxYFs6YJ3i4JNgi",
                                "cabin": "COACH",
                                "bookingCode": "L",
                                "bookingCodeCount": 3,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LyOCq14WZVzjXQMx",
                                        "aircraft": "73H",
                                        "arrivalTime": "2015-12-30T12:25+01:00",
                                        "departureTime": "2015-12-30T10:00+00:00",
                                        "origin": "LHR",
                                        "destination": "AMS",
                                        "originTerminal": "4",
                                        "duration": 85,
                                        "mileage": 229,
                                        "meal": "Snack or Brunch"
                                    }
                                ],
                                "connectionDuration": 505
                            },
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 270,
                                "flight": {
                                    "carrier": "KL",
                                    "number": "461"
                                },
                                "id": "GV8SB-BN7hExm8hM",
                                "cabin": "COACH",
                                "bookingCode": "L",
                                "bookingCodeCount": 3,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "Ld-AOaKElGYymRse",
                                        "aircraft": "73J",
                                        "arrivalTime": "2015-12-31T02:20+02:00",
                                        "departureTime": "2015-12-30T20:50+01:00",
                                        "origin": "AMS",
                                        "destination": "TLV",
                                        "destinationTerminal": "3",
                                        "duration": 270,
                                        "mileage": 2057,
                                        "meal": "Meal"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                                "carrier": "KL",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "L7WKWGB3"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                                "segmentId": "GaxYFs6YJ3i4JNgi"
                            },
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                                "segmentId": "GV8SB-BN7hExm8hM"
                            }
                        ],
                        "baseFareTotal": "GBP164.00",
                        "saleFareTotal": "GBP164.00",
                        "saleTaxTotal": "GBP111.01",
                        "saleTotal": "GBP275.01",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP30.11"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "CJ_001",
                                "chargeType": "GOVERNMENT",
                                "code": "CJ",
                                "country": "NL",
                                "salePrice": "GBP4.90"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "VV_001",
                                "chargeType": "GOVERNMENT",
                                "code": "VV",
                                "country": "NL",
                                "salePrice": "GBP0.40"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "RN_001",
                                "chargeType": "GOVERNMENT",
                                "code": "RN",
                                "country": "NL",
                                "salePrice": "GBP4.60"
                            }
                        ],
                        "fareCalculation": "LON KL X/AMS KL TLV 251.33L7WKWGB3 NUC 251.33 END ROE 0.652504 FARE GBP 164.00 XT 71.00GB 30.11UB 4.90CJ 4.60RN 0.40VV",
                        "latestTicketingTime": "2015-12-21T19:04-05:00",
                        "ptc": "ADT"
                    }
                ]
            },
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP300.36",
                "id": "ag85lXmWFfSUXxgd9kLMxI001",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 455,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 235,
                                "flight": {
                                    "carrier": "TK",
                                    "number": "1980"
                                },
                                "id": "GVnKKbf5UTm9OeVs",
                                "cabin": "COACH",
                                "bookingCode": "E",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LmV-PO9ZVjAo9li3",
                                        "aircraft": "333",
                                        "arrivalTime": "2015-12-30T17:35+02:00",
                                        "departureTime": "2015-12-30T11:40+00:00",
                                        "origin": "LHR",
                                        "destination": "IST",
                                        "originTerminal": "2",
                                        "destinationTerminal": "I",
                                        "duration": 235,
                                        "mileage": 1561,
                                        "meal": "Meal"
                                    }
                                ],
                                "connectionDuration": 95
                            },
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 125,
                                "flight": {
                                    "carrier": "TK",
                                    "number": "864"
                                },
                                "id": "GIneHYx0LHKJBtvd",
                                "cabin": "COACH",
                                "bookingCode": "E",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "1",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LYbUlYtIw4ny2kGe",
                                        "aircraft": "321",
                                        "arrivalTime": "2015-12-30T21:15+02:00",
                                        "departureTime": "2015-12-30T19:10+02:00",
                                        "origin": "IST",
                                        "destination": "TLV",
                                        "originTerminal": "I",
                                        "destinationTerminal": "3",
                                        "duration": 125,
                                        "mileage": 704,
                                        "meal": "Meal"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                                "carrier": "TK",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "EN2PXOW"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                                "segmentId": "GVnKKbf5UTm9OeVs"
                            },
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                                "segmentId": "GIneHYx0LHKJBtvd"
                            }
                        ],
                        "baseFareTotal": "GBP127.00",
                        "saleFareTotal": "GBP127.00",
                        "saleTaxTotal": "GBP173.36",
                        "saleTotal": "GBP300.36",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "TR_001",
                                "chargeType": "GOVERNMENT",
                                "code": "TR",
                                "country": "TR",
                                "salePrice": "GBP3.60"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "YR_F",
                                "chargeType": "CARRIER_SURCHARGE",
                                "code": "YR",
                                "salePrice": "GBP56.70"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP42.06"
                            }
                        ],
                        "fareCalculation": "LON TK X/IST TK TLV 194.63EN2PXOW NUC 194.63 END ROE 0.652504 FARE GBP 127.00 XT 71.00GB 42.06UB 3.60TR 56.70YR",
                        "latestTicketingTime": "2015-12-27T23:59-05:00",
                        "ptc": "ADT",
                        "refundable": true
                    }
                ]
            },
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP300.36",
                "id": "ag85lXmWFfSUXxgd9kLMxI004",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 680,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 235,
                                "flight": {
                                    "carrier": "TK",
                                    "number": "1988"
                                },
                                "id": "G7fAzcJdZmRz+jIm",
                                "cabin": "COACH",
                                "bookingCode": "E",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LaSx-geQXBwr+2vV",
                                        "aircraft": "32B",
                                        "arrivalTime": "2015-12-30T13:50+02:00",
                                        "departureTime": "2015-12-30T07:55+00:00",
                                        "origin": "LHR",
                                        "destination": "IST",
                                        "originTerminal": "2",
                                        "destinationTerminal": "I",
                                        "duration": 235,
                                        "mileage": 1561,
                                        "meal": "Meal"
                                    }
                                ],
                                "connectionDuration": 320
                            },
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 125,
                                "flight": {
                                    "carrier": "TK",
                                    "number": "864"
                                },
                                "id": "GIneHYx0LHKJBtvd",
                                "cabin": "COACH",
                                "bookingCode": "E",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "1",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LYbUlYtIw4ny2kGe",
                                        "aircraft": "321",
                                        "arrivalTime": "2015-12-30T21:15+02:00",
                                        "departureTime": "2015-12-30T19:10+02:00",
                                        "origin": "IST",
                                        "destination": "TLV",
                                        "originTerminal": "I",
                                        "destinationTerminal": "3",
                                        "duration": 125,
                                        "mileage": 704,
                                        "meal": "Meal"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                                "carrier": "TK",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "EN2PXOW"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                                "segmentId": "G7fAzcJdZmRz+jIm"
                            },
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                                "segmentId": "GIneHYx0LHKJBtvd"
                            }
                        ],
                        "baseFareTotal": "GBP127.00",
                        "saleFareTotal": "GBP127.00",
                        "saleTaxTotal": "GBP173.36",
                        "saleTotal": "GBP300.36",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "TR_001",
                                "chargeType": "GOVERNMENT",
                                "code": "TR",
                                "country": "TR",
                                "salePrice": "GBP3.60"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "YR_F",
                                "chargeType": "CARRIER_SURCHARGE",
                                "code": "YR",
                                "salePrice": "GBP56.70"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP42.06"
                            }
                        ],
                        "fareCalculation": "LON TK X/IST TK TLV 194.63EN2PXOW NUC 194.63 END ROE 0.652504 FARE GBP 127.00 XT 71.00GB 42.06UB 3.60TR 56.70YR",
                        "latestTicketingTime": "2015-12-27T23:59-05:00",
                        "ptc": "ADT",
                        "refundable": true
                    }
                ]
            },
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP318.01",
                "id": "ag85lXmWFfSUXxgd9kLMxI00A",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 755,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 80,
                                "flight": {
                                    "carrier": "KL",
                                    "number": "1010"
                                },
                                "id": "G714dbzwgO88ScSj",
                                "cabin": "COACH",
                                "bookingCode": "H",
                                "bookingCodeCount": 3,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "L4LzhaHuOSFJfPiH",
                                        "aircraft": "73W",
                                        "arrivalTime": "2015-12-30T14:05+01:00",
                                        "departureTime": "2015-12-30T11:45+00:00",
                                        "origin": "LHR",
                                        "destination": "AMS",
                                        "originTerminal": "4",
                                        "duration": 80,
                                        "mileage": 229,
                                        "meal": "Snack or Brunch"
                                    }
                                ],
                                "connectionDuration": 405
                            },
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 270,
                                "flight": {
                                    "carrier": "KL",
                                    "number": "461"
                                },
                                "id": "GV8SB-BN7hExm8hM",
                                "cabin": "COACH",
                                "bookingCode": "H",
                                "bookingCodeCount": 3,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "Ld-AOaKElGYymRse",
                                        "aircraft": "73J",
                                        "arrivalTime": "2015-12-31T02:20+02:00",
                                        "departureTime": "2015-12-30T20:50+01:00",
                                        "origin": "AMS",
                                        "destination": "TLV",
                                        "destinationTerminal": "3",
                                        "duration": 270,
                                        "mileage": 2057,
                                        "meal": "Meal"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "AVz9Z5DOqBQKkVQUTvePd059rsfUv9vmJ1tXzMvJh0xs",
                                "carrier": "KL",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "H7WKWGB3"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "AVz9Z5DOqBQKkVQUTvePd059rsfUv9vmJ1tXzMvJh0xs",
                                "segmentId": "GV8SB-BN7hExm8hM"
                            },
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "AVz9Z5DOqBQKkVQUTvePd059rsfUv9vmJ1tXzMvJh0xs",
                                "segmentId": "G714dbzwgO88ScSj"
                            }
                        ],
                        "baseFareTotal": "GBP207.00",
                        "saleFareTotal": "GBP207.00",
                        "saleTaxTotal": "GBP111.01",
                        "saleTotal": "GBP318.01",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP30.11"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "CJ_001",
                                "chargeType": "GOVERNMENT",
                                "code": "CJ",
                                "country": "NL",
                                "salePrice": "GBP4.90"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "VV_001",
                                "chargeType": "GOVERNMENT",
                                "code": "VV",
                                "country": "NL",
                                "salePrice": "GBP0.40"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "RN_001",
                                "chargeType": "GOVERNMENT",
                                "code": "RN",
                                "country": "NL",
                                "salePrice": "GBP4.60"
                            }
                        ],
                        "fareCalculation": "LON KL X/AMS KL TLV 317.23H7WKWGB3 NUC 317.23 END ROE 0.652504 FARE GBP 207.00 XT 71.00GB 30.11UB 4.90CJ 4.60RN 0.40VV",
                        "latestTicketingTime": "2015-12-30T06:44-05:00",
                        "ptc": "ADT",
                        "refundable": true
                    }
                ]
            },
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP355.36",
                "id": "ag85lXmWFfSUXxgd9kLMxI009",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 670,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 235,
                                "flight": {
                                    "carrier": "TK",
                                    "number": "1980"
                                },
                                "id": "GVnKKbf5UTm9OeVs",
                                "cabin": "COACH",
                                "bookingCode": "H",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LmV-PO9ZVjAo9li3",
                                        "aircraft": "333",
                                        "arrivalTime": "2015-12-30T17:35+02:00",
                                        "departureTime": "2015-12-30T11:40+00:00",
                                        "origin": "LHR",
                                        "destination": "IST",
                                        "originTerminal": "2",
                                        "destinationTerminal": "I",
                                        "duration": 235,
                                        "mileage": 1561,
                                        "meal": "Meal"
                                    }
                                ],
                                "connectionDuration": 310
                            },
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 125,
                                "flight": {
                                    "carrier": "TK",
                                    "number": "810"
                                },
                                "id": "GQaopRCWxzfg+7NL",
                                "cabin": "COACH",
                                "bookingCode": "H",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "1",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LBBdh026qMKnIOKT",
                                        "aircraft": "321",
                                        "arrivalTime": "2015-12-31T00:50+02:00",
                                        "departureTime": "2015-12-30T22:45+02:00",
                                        "origin": "IST",
                                        "destination": "TLV",
                                        "originTerminal": "I",
                                        "destinationTerminal": "3",
                                        "duration": 125,
                                        "mileage": 704,
                                        "meal": "Meal"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "ALpARxvgnuNIq4hwoH5vEYyVh5WSHYoe6wNpvJuLv7h2",
                                "carrier": "TK",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "HN2XOX"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "ALpARxvgnuNIq4hwoH5vEYyVh5WSHYoe6wNpvJuLv7h2",
                                "segmentId": "GVnKKbf5UTm9OeVs"
                            },
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "ALpARxvgnuNIq4hwoH5vEYyVh5WSHYoe6wNpvJuLv7h2",
                                "segmentId": "GQaopRCWxzfg+7NL"
                            }
                        ],
                        "baseFareTotal": "GBP182.00",
                        "saleFareTotal": "GBP182.00",
                        "saleTaxTotal": "GBP173.36",
                        "saleTotal": "GBP355.36",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "TR_001",
                                "chargeType": "GOVERNMENT",
                                "code": "TR",
                                "country": "TR",
                                "salePrice": "GBP3.60"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "YR_F",
                                "chargeType": "CARRIER_SURCHARGE",
                                "code": "YR",
                                "salePrice": "GBP56.70"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP42.06"
                            }
                        ],
                        "fareCalculation": "LON TK X/IST TK TLV 278.92HN2XOX NUC 278.92 END ROE 0.652504 FARE GBP 182.00 XT 71.00GB 42.06UB 3.60TR 56.70YR",
                        "latestTicketingTime": "2015-12-30T06:39-05:00",
                        "ptc": "ADT",
                        "refundable": true
                    }
                ]
            },
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP378.11",
                "id": "ag85lXmWFfSUXxgd9kLMxI007",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 410,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 110,
                                "flight": {
                                    "carrier": "AB",
                                    "number": "5006"
                                },
                                "id": "GEU9fblnGizpBr9S",
                                "cabin": "COACH",
                                "bookingCode": "L",
                                "bookingCodeCount": 1,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "Lq4g2UzRT0uroikZ",
                                        "aircraft": "32A",
                                        "arrivalTime": "2015-12-30T21:25+01:00",
                                        "departureTime": "2015-12-30T18:35+00:00",
                                        "origin": "LHR",
                                        "destination": "TXL",
                                        "originTerminal": "5",
                                        "duration": 110,
                                        "operatingDisclosure": "OPERATED BY BRITISH AIRWAYS",
                                        "mileage": 588,
                                        "meal": "Snack or Brunch"
                                    }
                                ],
                                "connectionDuration": 60
                            },
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 240,
                                "flight": {
                                    "carrier": "AB",
                                    "number": "8380"
                                },
                                "id": "G4ic9MLL33mOyIkj",
                                "cabin": "COACH",
                                "bookingCode": "L",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "1",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LP8v5kIeXOajRLPX",
                                        "aircraft": "738",
                                        "arrivalTime": "2015-12-31T03:25+02:00",
                                        "departureTime": "2015-12-30T22:25+01:00",
                                        "origin": "TXL",
                                        "destination": "TLV",
                                        "destinationTerminal": "3",
                                        "duration": 240,
                                        "mileage": 1783,
                                        "meal": "Snack or Brunch"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "AkTe1cUpydenbavugThqmdH1Ya9lE8SAHxThaMKlmZ4/",
                                "carrier": "AB",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "LRCOW"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "AkTe1cUpydenbavugThqmdH1Ya9lE8SAHxThaMKlmZ4/",
                                "segmentId": "G4ic9MLL33mOyIkj"
                            },
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "AkTe1cUpydenbavugThqmdH1Ya9lE8SAHxThaMKlmZ4/",
                                "segmentId": "GEU9fblnGizpBr9S"
                            }
                        ],
                        "baseFareTotal": "GBP226.00",
                        "saleFareTotal": "GBP226.00",
                        "saleTaxTotal": "GBP152.11",
                        "saleTotal": "GBP378.11",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "DE_001",
                                "chargeType": "GOVERNMENT",
                                "code": "DE",
                                "country": "DE",
                                "salePrice": "GBP4.30"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "RA_002",
                                "chargeType": "GOVERNMENT",
                                "code": "RA",
                                "country": "DE",
                                "salePrice": "GBP7.50"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "YQ_F",
                                "chargeType": "CARRIER_SURCHARGE",
                                "code": "YQ",
                                "salePrice": "GBP39.20"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP30.11"
                            }
                        ],
                        "fareCalculation": "LON AB X/BER AB TLV M 346.35LRCOW NUC 346.35 END ROE 0.652504 FARE GBP 226.00 XT 71.00GB 30.11UB 4.30DE 7.50RA 39.20YQ",
                        "latestTicketingTime": "2015-12-22T19:04-05:00",
                        "ptc": "ADT",
                        "refundable": true
                    }
                ]
            },
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP438.46",
                "id": "ag85lXmWFfSUXxgd9kLMxI003",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 290,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 290,
                                "flight": {
                                    "carrier": "LY",
                                    "number": "316"
                                },
                                "id": "GaIcvkkdooheV6Ey",
                                "cabin": "COACH",
                                "bookingCode": "Q",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LrfNv4IGFj88P2qH",
                                        "aircraft": "744",
                                        "arrivalTime": "2015-12-30T21:10+02:00",
                                        "departureTime": "2015-12-30T14:20+00:00",
                                        "origin": "LHR",
                                        "destination": "TLV",
                                        "originTerminal": "4",
                                        "destinationTerminal": "3",
                                        "duration": 290,
                                        "mileage": 2229,
                                        "meal": "Hot Meal"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "A2KEtNzgO42eMzX0QHy43cCvfIx7pKiPtFg+hb9r4NpY",
                                "carrier": "LY",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "QUKOW"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "A2KEtNzgO42eMzX0QHy43cCvfIx7pKiPtFg+hb9r4NpY",
                                "segmentId": "GaIcvkkdooheV6Ey"
                            }
                        ],
                        "baseFareTotal": "GBP320.00",
                        "saleFareTotal": "GBP320.00",
                        "saleTaxTotal": "GBP118.46",
                        "saleTotal": "GBP438.46",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "AP_001",
                                "chargeType": "GOVERNMENT",
                                "code": "AP",
                                "country": "IL",
                                "salePrice": "GBP5.40"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP42.06"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            }
                        ],
                        "fareCalculation": "LON LY TLV Q99.61 M 390.80QUKOW NUC 490.41 END ROE 0.652504 FARE GBP 320.00 XT 71.00GB 42.06UB 5.40AP",
                        "latestTicketingTime": "2015-12-30T09:19-05:00",
                        "ptc": "ADT"
                    }
                ]
            },
            {
                "kind": "qpxexpress#tripOption",
                "saleTotal": "GBP438.46",
                "id": "ag85lXmWFfSUXxgd9kLMxI005",
                "slice": [
                    {
                        "kind": "qpxexpress#sliceInfo",
                        "duration": 290,
                        "segment": [
                            {
                                "kind": "qpxexpress#segmentInfo",
                                "duration": 290,
                                "flight": {
                                    "carrier": "LY",
                                    "number": "318"
                                },
                                "id": "Gkr9-3d-T+QFmcbV",
                                "cabin": "COACH",
                                "bookingCode": "Q",
                                "bookingCodeCount": 9,
                                "marriedSegmentGroup": "0",
                                "leg": [
                                    {
                                        "kind": "qpxexpress#legInfo",
                                        "id": "LjlESjbs3S6RNtfr",
                                        "aircraft": "772",
                                        "arrivalTime": "2015-12-31T05:20+02:00",
                                        "departureTime": "2015-12-30T22:30+00:00",
                                        "origin": "LHR",
                                        "destination": "TLV",
                                        "originTerminal": "4",
                                        "destinationTerminal": "3",
                                        "duration": 290,
                                        "mileage": 2229,
                                        "meal": "Hot Meal"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "pricing": [
                    {
                        "kind": "qpxexpress#pricingInfo",
                        "fare": [
                            {
                                "kind": "qpxexpress#fareInfo",
                                "id": "A2KEtNzgO42eMzX0QHy43cCvfIx7pKiPtFg+hb9r4NpY",
                                "carrier": "LY",
                                "origin": "LON",
                                "destination": "TLV",
                                "basisCode": "QUKOW"
                            }
                        ],
                        "segmentPricing": [
                            {
                                "kind": "qpxexpress#segmentPricing",
                                "fareId": "A2KEtNzgO42eMzX0QHy43cCvfIx7pKiPtFg+hb9r4NpY",
                                "segmentId": "Gkr9-3d-T+QFmcbV"
                            }
                        ],
                        "baseFareTotal": "GBP320.00",
                        "saleFareTotal": "GBP320.00",
                        "saleTaxTotal": "GBP118.46",
                        "saleTotal": "GBP438.46",
                        "passengers": {
                            "kind": "qpxexpress#passengerCounts",
                            "adultCount": 1
                        },
                        "tax": [
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "AP_001",
                                "chargeType": "GOVERNMENT",
                                "code": "AP",
                                "country": "IL",
                                "salePrice": "GBP5.40"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "UB",
                                "chargeType": "GOVERNMENT",
                                "code": "UB",
                                "country": "GB",
                                "salePrice": "GBP42.06"
                            },
                            {
                                "kind": "qpxexpress#taxInfo",
                                "id": "GB_001",
                                "chargeType": "GOVERNMENT",
                                "code": "GB",
                                "country": "GB",
                                "salePrice": "GBP71.00"
                            }
                        ],
                        "fareCalculation": "LON LY TLV Q99.61 M 390.80QUKOW NUC 490.41 END ROE 0.652504 FARE GBP 320.00 XT 71.00GB 42.06UB 5.40AP",
                        "latestTicketingTime": "2015-12-30T17:29-05:00",
                        "ptc": "ADT"
                    }
                ]
            }
        ]
    }
};
