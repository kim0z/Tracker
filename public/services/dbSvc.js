trackerApp.service('dataBaseService', ['$http', function ($http) {

    this.saveTrip = function (dataObj) { //not sure it still in use, if not then I soud remove
        console.log('database service');
        return $http.post('/saveTrip', dataObj);
    };

    this.createNewTripRecord = function () { //in use
        console.log('Client::dataBaseService:: create new trip record');
        return $http.post('/insertNewEmptyTrip');
    };


    this.saveNewTrip = function (dataObj) { // in use
        console.log('Client::dataBaseService:: save new trip with data from the planning page');
        //return $http.post('/saveNewTrip', dataObj);
        return $http.post('/insertTrip', dataObj);
    };

    //get all trips
    this.getTrips = function () { // in use
        console.log('Client::dataBaseService:: get all trips from table = trips');
        return $http.post('/readTrips');
    };

    //get all trip by id
    this.getTripById = function (dataTripId) { // in use
        console.log('Client::dataBaseService:: get all trips from table = trips');
        return $http.post('/getTripById', dataTripId);
    };











    this.getLastTripId = function () {  //deprecated
        return $http.post('/getLastTripId');
    };

    this.getTripsNumber = function () {
        return $http.post('/getTripNumbers');
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