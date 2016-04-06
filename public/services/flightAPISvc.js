trackerApp.service('flightAPIService', ['$http', function ($http) {

    this.getNearestAirports = function (dataObj) {
        console.log('Client::flight service:: get the nearest '+ dataObj.maxAirports+' airport for lat: '+dataObj.lat+'lng:'+dataObj.lng);

        return $http.post('/getNearestAirports', dataObj);

        //// the result return in JSON format (Server converted the response from XML to JSON)
        //answer looks like:
        //{"airportResponse":{"$":{"authorisedAPI":"true","processingDurationMillis":"119","success":"true"},"airports":[{"airports":[{"$":{"city":"Tel-aviv","country":"Israel","lat":"32.011389","lng":"34.886667","name":"Ben Gurion","timezone":"Asia/Jerusalem"},"code":["TLV"]}]}]}}
    };

}]);