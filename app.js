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


var express = require('express');
var app = express(); 								// create our app w/ express
var port = process.env.PORT || 9090;
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

//######################################################################################################################


// General variables

/////////////////////

//#####################################################
//# Rest Calls                                       #
//####################################################
//REST calls for Postgres DB

//Postgres :: Insert new trip to the table of trips with data
app.post('/insertTrip', function (request, response) {

    console.log('SERVER:: Postgres:: insert new record to trips table with data');
    var jsonTrip = request.body;

    var cities = '{'+jsonTrip['username'].trip.cities+'}';
    var tripGeneral = jsonTrip['username'].trip.general;
    tripGeneral.continent = '{'+ tripGeneral.continent +'}';

    console.log(tripGeneral.start_date);
    console.log(tripGeneral.end_date);

    pg.connect(conString, function(err, client, done) {
        if(err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("INSERT INTO trips(trip_name, start_date, end_date, continent, cities, trip_description) values($1, $2, $3, $4, $5, $6)",
            [tripGeneral.trip_name, tripGeneral.start_date, tripGeneral.end_date, tripGeneral.continent , cities, tripGeneral.trip_description], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
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

    pg.connect(conString, function(err, client, done) {
        if(err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("INSERT INTO trips(trip_name) values($1) RETURNING id", //generate auto name
            [''], function(err, result) {
                //call `done()` to release the client back to the pool
                done();

                if(err) {
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
    console.log('SERVER:: Postgres:: update trip'+request.body);

    var jsonTrip = request.body;

    //var cities = '{'+jsonTrip['username'].trip.cities+'}';
    var table_plan = jsonTrip['username'].trip.table_plan;



    // example:: get city days :: jsonTrip['username'].trip.cities['days0']

    var tripGeneral = jsonTrip['username'].trip.general;
    tripGeneral.continent = '{'+ tripGeneral.continent +'}';


    //    client.query("UPDATE items SET text=($1), complete=($2) WHERE id=($3)", [data.text, data.complete, id]);

    pg.connect(conString, function(err, client, done) {
        if(err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("UPDATE trips SET trip_name = ($1), start_date = ($2), end_date =($3) , continent = ($4), table_plan = ($5), trip_description = ($6) WHERE id = ($7)",
            [tripGeneral.trip_name, tripGeneral.start_date, tripGeneral.end_date, tripGeneral.continent , table_plan, tripGeneral.trip_description, tripGeneral.trip_id]
            ,function(err, result) {
                //call `done()` to release the client back to the pool
                done();

                if(err) {
                    return console.error('error running query', err);
                }
                console.log(result);
                //output: 1
            });
    });
    response.status(200).end();

});

//Postgres read trips table
app.post('/readTrips', function (request, response) {

    console.log('SERVER:: Postgres:: get all trip from trips table');
    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {
        // Handle connection errors
        if(err) {
            done();
            console.log(err);
            return response.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM trips ORDER BY id ASC;");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            return response.json(results);
        });

    });
});




//Postgres get trip by id
app.post('/getTripById', function (request, response) {

    console.log('SERVER:: Postgres:: get trip by id :: trip id ::'+request.body.trip_id);
    var trip_id = request.body.trip_id;
    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {
        // Handle connection errors
        if(err) {
            done();
            console.log(err);
            return response.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("SELECT * FROM trips WHERE id = "+trip_id+";");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            console.log(results); // looks like : [{....}]
            tripById = results;
            return response.json(results);
        });

    });
});

//Postgres Delete trip by id
app.post('/deleteTripById', function (request, response) {

    console.log('SERVER:: Postgres:: delete trip by id :: trip id ::'+request.body.trip_id);
    var trip_id = request.body.trip_id;
    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {
        // Handle connection errors
        if(err) {
            done();
            console.log(err);
            return response.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("DELETE FROM trips WHERE id = "+trip_id+";");

        // Stream results back one row at a time
     //   query.on('row', function(row) {
       //     results.push(row);
      //  });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            console.log(results); // looks like : [{....}]
          //  tripById = results;
            return response.json(results);
        });

    });
});


//Create trip table
app.post('/createTable', function (request, response){
    var table = [];

    console.log('SERVER:: Postgres:: Create trip table');
    var trip_id = request.body.trip_id;
    var results = [];

    // Get a Postgres client from the connection pool
    pg.connect(conString, function(err, client, done) {
        // Handle connection errors
        if(err) {
            done();
            console.log(err);
            return response.status(500).json({ success: false, data: err});
        }

        // SQL Query > Select Data
        var query = client.query("SELECT table_plan FROM trips WHERE id = "+trip_id+";");

        // Stream results back one row at a time
        query.on('row', function(row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function() {
            done();
            console.log(results); // looks like : [{....}]
            jsonTable = results;

            //create array of cities and days, if London have 2 days then 2 cells will be added to the array shown the city name and the day number
            var dayNumber = 0;
            //create Json Table
            if(results[0].table_plan) {
                for (var i = 0; i < results[0].table_plan.length; i++) {
                    for (var j = 0; j < results[0].table_plan[i]['days' + i]; j++) {
                        dayNumber++;
                        var day = {
                            day: dayNumber,
                            city: results[0].table_plan[i]['city' + i],
                            flight: '',
                            car: '',
                            action1: '',
                            action2: ''
                        };

                        table.push(day);

                        day = '';
                    }
                }
                console.log('SERVER:: Create table:: ' + table);
                return response.json(table);
            }
        });
    });
});



//get last trip id from the trips table
app.post('/getLastTripId', function (request, response) {
    console.log('SERVER: get last trip id from trips table');

    pg.connect(conString, function(err, client, done) {
        if(err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("SELECT * limit 1", function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                return console.error('error running query', err);
            }
            console.log('SERVER: last trip id: '+ result);
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
console.log('Server::: Get GeoCode for city::'+ request.body); // print the city name from UI
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
    }else console.log("Hello from DropBox, " + accountInfo.name + "!");
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


// ################### Google Flights ############################## //

app.post('/getFlight', function (request, response) {
    // create http request client to consume the QPX API
    var request = require("request")

    // JSON to be passed to the QPX Express API
    var requestData = {
        "request": {
            "slice": [
                {
                    "origin": "ZRH",
                    "destination": "DUS",
                    "date": "2015-12-02"
                }
            ],
            "passengers": {
                "adultCount": 1,
                "infantInLapCount": 0,
                "infantInSeatCount": 0,
                "childCount": 0,
                "seniorCount": 0
            },
            "solutions": 2,
            "refundable": false
        }
    }

    // QPX REST API URL
    url = "https://www.googleapis.com/qpxExpress/v1/trips/search?key=AIzaSyBgSxdli3zXpI3dPtFR9H0fbVZIcSZOvyo"

    // fire request
    request({
        url: url,
        method: "POST",
        json: requestData

    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log(body)
        }
        else {

            console.log("error: " + error)
            console.log("response.statusCode: " + response.statusCode)
            console.log("response.statusText: " + response.statusText)
        }
    })
});
