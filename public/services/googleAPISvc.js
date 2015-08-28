trackerApp.service('googleMapsAPIService', ['$http', function ($http) {

    this.getGeoCode = function (dataObj) {
        return $http.post('/getGeoCode', dataObj);
    };

    this.createCircles = function (citiesObj) {
        var citiesGeo = [];

        for (var i = 0; i < citiesObj.length; i++) {
            console.log(citiesObj[i]);
            var arr = [citiesObj[i]];  // should be removed, enter the city name directly to this.getGeoCode()
            citiesGeo.push(this.getGeoCode(arr));
        }
        return citiesGeo;
    }

}]);