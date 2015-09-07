trackerApp.service('dataBaseService', ['$http', function ($http) {

    this.saveTrip = function (dataObj) {
        console.log('database service');
        return $http.post('/saveTrip', dataObj);
    };

    this.getLastTripId = function () {
        return $http.post('/getLastTripId');
    };

    this.getTrip = function () {
        return $http.post('/getTrip');
/*
        console.log('ffff');
       // return $http.post('/getTrip');

        return $http.post('/getTrip').then(function(results) {
            // Just return the HTTP body
            return results.data;
        });*/
    };

    //get GPS from server "server is getting the data from DropBox that was saved by Android"
    this.getGpsPoints = function () {
        return $http.post('/getGpsPoints');
    };


}]);