trackerApp.service('algorithmsService', ['$http', '$q', 'flightAPIService', 'googleMapsAPIService', function ($http, $q, flightAPIService, googleMapsAPIService) {

    /*
     #this service get the table content and return when flight needed
     #table example: [{"day":1,"city":"haifa","flight":"","car":"","action1":"","action2":""},{"day":2,"city":"london","flight":"","car":"","action1":"","action2":""},...]
     #if city name different from other city name then flight needed
     #next step: check destination to find out if flight needed
     */


    this.whenFlightNeeded = function (table) {
        var deferred = $q.defer();
        console.log('Algorithms service:: When Flight needed started');

        for (var i = 0; i < table.length - 1; i++) {

            if (table[i].city == table[i + 1].city)
                table[i].flight.flight = false;
            else
                table[i].flight.flight = true;

            console.log('Algorithms service:: ' + table[i].flight.flight);
        }
        deferred.resolve(table);
        return deferred.promise;

        //return table;
    };


    // googleMapsAPIService.getFlights = function (flightParam) {
    //send example json : {origin: "TLV", destination:"JFK", date:"2015-12-30", solutions: 10};


    //1 function should handle all flight prices and return array with flight + price

    //Step 1: get the table and check if flight needed by using "whenFlightNeeded()"
    //Step 2: get airports nearby for the needed cities
    //Step 3: get flights from origin to distention to each city * airports
    //step 4: return price

    this.addAirportsToTable = function (table) {

        // var defered = $q.defer();
        return this.whenFlightNeeded(table)
            .then(function (result) {
            var airportPromises = [];
            var table = result;
            //result include the table structure + flight needed or not flag, when flight = true it means from this city to the next city a flight needed
            //get airports for the origin and dist, save into table
            for (let dayIndex = 0; dayIndex < table.length; dayIndex++) {
                if (table[dayIndex].flight.flight) {
                    //get airports for the city and the next city
                    //get origin airport code by using SITA service, with the city lat, lng
                    //dataObj.maxAirports+' airport for lat: '+dataObj.lat+'lng:'+dataObj.lng
                    var origin = {
                        maxAirports: 3,
                        lat: table[dayIndex]['cityGoogleInf'][0].latitude,
                        lng: table[dayIndex]['cityGoogleInf'][0].longitude
                    };
                    var dist = {
                        maxAirports: 3,
                        lat: table[dayIndex + 1]['cityGoogleInf'][0].latitude,
                        lng: table[dayIndex + 1]['cityGoogleInf'][0].longitude
                    };

                    airportPromises.push(flightAPIService.getNearestAirports(origin).then(function (resultOriginAirport) {
                        table[dayIndex]['flight'].airport.push(resultOriginAirport.data);
                    }));

                    airportPromises.push(flightAPIService.getNearestAirports(dist).then(function (resultDistAirport) {
                        table[dayIndex + 1]['flight'].airport.push(resultDistAirport.data);
                    }));

                    // airportPromises.concat([promise1,promise2]);
                }
            }

            return $q.all(airportPromises);/*.then(function (res) {
                return callback(null, table);
                console.log(table);
            }, function (err) {
                callback(err);
                return console.error('one promise error', err);
            })*/
        });
        //return defered.promise;
    }

    this.buildFlights = function (table) {

        return this.addAirportsToTable(table).then(function (res) {
            //when make sure that airports updated in table then let's find flights, res include airports in table
            //console.log(res);
            //var table = res;

            var promisesTickets = [];

            for (let dayIndex = 0; dayIndex < table.length; dayIndex++) {
                if (table[dayIndex].flight.flight && table[dayIndex]['flight'].airport.length > 0) {

                    //send flight date and origin airports & dist airports

                    // getFlightsBy2Airports(table[dayIndex]['flight'].airport, table[dayIndex + 1]['flight'].airport, table[dayIndex].date, function (err, resTickets) {
                    //      table[dayIndex]['flight']['tickets'] = resTickets;
                    //  });

                    promisesTickets.push(
                        getFlightsBy2Airports(table[dayIndex]['flight'].airport, table[dayIndex + 1]['flight'].airport, table[dayIndex].date)
                        .then(function(resTickets){
                        table[dayIndex]['flight']['tickets'] = resTickets;
                    }));
                //}

                }
            }
            return $q.all(promisesTickets);/*.then(function () {
                //return callback(null, tickets);
                //return table;
                console.log('all done',table);
            }, function (err) {
                //callback(err);
                return console.error('one promise error', err);
            })*/
        });
    }


    getFlightsBy2Airports = function (originAirport, disAirport, flightDate) {

        //each airport contain the nearest airports
        //loop the origin airports, each airport will be scanned with the all destination airports
        var allTicketsPrmoises = [];
        var deferred = $q.defer();
        var tickets = [];

        var originAirportsLen = originAirport[0]['airportResponse']['airports'][0]['airports'].length;
        var distAirportsLen = disAirport[0]['airportResponse']['airports'][0]['airports'].length;

        var originAirports = originAirport[0]['airportResponse']['airports'][0]['airports'];
        var distAirports = disAirport[0]['airportResponse']['airports'][0]['airports'];

        for (let i = 0; i < originAirportsLen; i++) {
            var originAirportsLen = originAirport[0]['airportResponse']['airports'][0]['airports'].length;
            for (let j = 0; j < distAirportsLen; j++) {
                //get flights for the current origin airport to all the airports in destination

                //send example json : {origin: "TLV", destination:"JFK", date:"2015-12-30", solutions: 10};

                var flight = {
                    origin: originAirports[i]['code'][0],
                    destination: distAirports[j]['code'][0],
                    //date: flightDate.substring(0,10),
                    date: '2016-05-18',
                    solutions: 10
                };
                console.log(flight);

                allTicketsPrmoises.push(googleMapsAPIService.getFlights(flight)/*.then(function (ticket) {
                    tickets[j] = ticket;
                })*/);
            }

        }

        return $q.all(allTicketsPrmoises);/*.then(function () {
             return  //callback(null, tickets);
            //return tickets;
            console.log(tickets);
        }, function (err) {
            callback(err);
            return console.error('one promise error', err);
        })*/


        //return allTickets;
    }

}]);