trackerApp.service('googleMapsAPIService', ['$http', function ($http) {

    this.getGeoCode = function (cityObj) {
        console.log('Google Service:: getGeoCode :: City name :: '+ cityObj.city);
        return $http.post('/getGeoCode', cityObj);
    };


    this.getGeoCodeForArray = function (citiesObj) {
        var citiesGeo = [];

        for (var i = 0; i < citiesObj.length; i++) {
            console.log(citiesObj[i]);
            var arr = [citiesObj[i]];  // should be removed, enter the city name directly to this.getGeoCode()
            citiesGeo.push(this.getGeoCode(arr));
        }
        return citiesGeo;
    }
/*
    this.getFlights = function (flighReq) {
        return $http.post('/getFlights',flighReq);
    };*/

    this.getFlights = function (flightParam) {
        //send example json : {origin: "TLV", destination:"JFK", date:"2015-12-30", solutions: 10};

        //flightParam = {origin: "TLV", destination:"JFK", date:"2015-12-30", solutions: 10};
        return $http.post('/getFlights', flightParam);
    };

}]);