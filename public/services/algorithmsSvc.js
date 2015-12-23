trackerApp.service('algorithmsService', ['$http', function ($http) {

    /*
     #this service get the table content and return when flight needed
     #table example: [{"day":1,"city":"haifa","flight":"","car":"","action1":"","action2":""},{"day":2,"city":"london","flight":"","car":"","action1":"","action2":""},...]
     #if city name different from other city name then flight needed
     #next step: check destination to find out if flight needed
     */


    this.whenFlightNeeded = function (table) {
        console.log('Algorithms service:: When Flight needed started');
        for (var i = 0; i < table.length - 1; i++) {

            if (table[i].city == table[i + 1].city)
                table[i].flight.flight = false;
            else
                table[i].flight.flight = true;

            console.log('Algorithms service:: ' + table[i].flight.flight);
        }
        return table;
    };


    this.getFlightsByPrice = function (flights) {
        console.log('Algorithms service:: Get flights by price');
        var flightsByPrice = '';

        console.log(flights.trips.tripOption);

        return flights.trips.tripOption;

    }


}]);