trackerApp.service('dataBaseService', ['$http', function ($http) {

    this.createNewTripRecord = function () { //create empty trip record
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

    //get trip by id
    this.getTripById = function (dataTripId) { // in use
        console.log('Client::dataBaseService:: get trip by id::'+dataTripId);
        return $http.post('/getTripById', dataTripId);
    };

    //deleteTripById
    this.deleteTripById = function (dataTripId) { // in use
        console.log('Client::dataBaseService:: delete trip id::'+ dataTripId);
        return $http.post('/deleteTripById', dataTripId);
    };


    //updateTrip
    this.updateTrip = function (dataObj) { //create empty trip record
        console.log('Client::dataBaseService:: update trip record');
        return $http.post('/updateTrip',dataObj);
    };

    //createTable
    this.createTable = function (dataTripId) { //create empty trip record
        console.log('Client::dataBaseService:: Create table for trip id::'+dataTripId);
        return $http.post('/createTable',dataTripId);
    };

    //get GPS from server "server is getting the data from DropBox that was saved by Android"
    this.getGpsPoints = function () {
        return $http.post('/getGpsPoints');
    };

    //get GPS points - from Firebase
    this.getGpsTrack = function () {
        return $http.post('/getGpsTrack');
    };

    //############ User Auth management #################
    //##################################################

    //Check if user exists -- should be encrypted
    this.checkUserExistsByEmail = function (user) {
        return $http.post('/checkUserExistsByEmail', user);
    };

    //Add new user
    this.addNewUser = function (user) {
        return $http.post('/addNewUser', user);
    };

    //get all users
    this.getUsersList = function () {
        return $http.post('/getUsersList');
    };

}]);