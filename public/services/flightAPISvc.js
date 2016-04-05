trackerApp.service('flightAPIService', ['$http', function ($http) {

    this.getNearestAirports = function (dataObj) {
        console.log('Client::flight service:: get the nearest '+ dataObj.maxAirports+' airport for lat: '+dataObj.lat+'lng:'+dataObj.lng);

        return $http.post('/getNearestAirports', dataObj);

        //// the result return in JSONP format
        //answer looks like:
        // callback({"processingDurationMillis":5,"authorisedAPI":true,"success":true,"airline":null,"errorMessage":null,"airports":[{"code":"TLV","name":"Ben Gurion","city":"Tel-aviv","country":"Israel","timezone":"Asia/Jerusalem","lat":32.011389,"lng":34.886667,"terminal":null,"gate":null}]})
    };

}]);