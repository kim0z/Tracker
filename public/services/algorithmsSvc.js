trackerApp.service('algorithmsService', ['$http', '$q', 'flightAPIService', function ($http, $q, flightAPIService) {

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

    //1 function should handle all flight prices and return array with flight + price

    //Step 1: get the table and check if flight needed by using "whenFlightNeeded()"
    //Step 2: get airports nearby for the needed cities
    //Step 3: get flights from origin to distention to each city * airports
    //step 4: return price


    this.buildFlights = function (table) {

        this.whenFlightNeeded(table).then(function (result) {

            //result include the table structure + flight needed or not flag, when flight = true it means from this city to the next city a flight needed

            //get airports for the origin and dist, save into table


            for (let dayIndex = 0; dayIndex < table.length; dayIndex++) {

                if (table[dayIndex].flight.flight) {

                    //get airports for the city and the next city
                    //get origin airport code by using SITA service, with the city lat, lng
                    //dataObj.maxAirports+' airport for lat: '+dataObj.lat+'lng:'+dataObj.lng
                    var origin = {maxAirports:3, lat: table[dayIndex]['cityGoogleInf'][0].latitude, lng: table[dayIndex]['cityGoogleInf'][0].longitude};
                    var dist = {maxAirports:3, lat: table[dayIndex + 1]['cityGoogleInf'][0].latitude, lng: table[dayIndex + 1]['cityGoogleInf'][0].longitude};


                    Promise.resolve(flightAPIService.getNearestAirports(origin)).then(function (resultOriginAirport) {



                        table[dayIndex]['flight'].airport.push(resultOriginAirport.data);

                    //    flightInfo['originAirportCode'] = resultOriginAirport.data['airportResponse']['airports'][0]['airports'][0]['code'];
                    //    flightInfo['originAirportName'] = resultOriginAirport.data['airportResponse']['airports'][0]['airports'][0]['$']['name'];

                    })

                    Promise.resolve(flightAPIService.getNearestAirports(dist)).then(function (resultDistAirport) {



                        table[dayIndex + 1]['flight'].airport.push(resultDistAirport.data);

                        //    flightInfo['originAirportCode'] = resultOriginAirport.data['airportResponse']['airports'][0]['airports'][0]['code'];
                        //    flightInfo['originAirportName'] = resultOriginAirport.data['airportResponse']['airports'][0]['airports'][0]['$']['name'];

                    })




                }

            }


            return table;

        });






    }













    this.getFlightsByPrice = function (flights) {
        console.log('Algorithms service:: Get flights by price');
        var flightsByPrice = '';

        console.log(flights.trips.tripOption);

        return flights.trips.tripOption;

    }


}]);