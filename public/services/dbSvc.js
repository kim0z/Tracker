trackerApp.service('dataBaseService', ['$http', function ($http) {

    //get Trip path Hash table
    this.getTripPathHash = function (data) { // in use
        console.log('Client::dataBaseService:: get Trip path Hash Table');
        return $http.post('/getTripPath', data);
    };

    //get Places for Trip path
    this.getTripPlaces = function (hashPath) { // in use
        console.log('Client::dataBaseService:: get Trip Places');
        return $http.post('/getTripPlaces', hashPath);
    };

    this.createNewTripRecord = function () { //create empty trip record
        console.log('Client::dataBaseService:: create new trip record');
        return $http.post('/insertNewEmptyTrip');
    };

    this.saveNewTrip = function (dataObj) { // in use
        console.log('Client::dataBaseService:: save new trip with data from the planning page');
        //return $http.post('/saveNewTrip', dataObj);
        return $http.post('/insertTrip', dataObj);
    };

    //get all trips by user email
    this.getTrips = function (userEmail) { // in use
        console.log('Client::dataBaseService:: get all trips from table = trips by user email');
        return $http.post('/getMyTrips', userEmail);
    };

    //get all public trips
    this.getPublicTrips = function (userEmail) { // userEmail not used in this case
        console.log('Client::dataBaseService:: get all public trips');
        return $http.post('/getPublicTrips', userEmail);
    };

    //saveProfilePicture - Not used, when create new trip I also update the profile picture in the same function
   /* this.saveProfilePicture = function (dataObj) { // userEmail not used in this case
        console.log('Client::dataBaseService:: save profile picture');
        return $http.post('/saveProfilePicture', dataObj);
    };*/

    //get trip by id
    this.getTripById = function (dataTripId) { // in use
        console.log('Client::dataBaseService:: get trip by id::', dataTripId);
        return $http.post('/getTripById', dataTripId);
    };

    //deleteTripById
    this.deleteTripById = function (dataTripId) { // in use
        console.log('Client::dataBaseService:: delete trip id::'+ dataTripId);
        return $http.post('/deleteTripById', dataTripId);
    };

    //update trip photo provider in DB Postgres, by default it aws, could be Facebook, in the future will be also Instagram
    this.updateTripPhotosProvider = function (dataTripId) { // in use
        console.log('Client::dataBaseService:: get trip photos source::'+dataTripId);
        return $http.post('/updateTripPhotosProvider', dataTripId);
    };


    //updateTrip - used for planning page
    this.updateTrip = function (dataObj) { //create empty trip record
        console.log('Client::dataBaseService:: update trip record');
        return $http.post('/updateTrip',dataObj);
    };

    //update new trip used for the the new flow of creating a test
    this.updateTripGeneralInfo = function (dataObj) {
        console.log('Client::dataBaseService:: update trip record, to create new general trip');
        return $http.post('/updateTripGeneralInfo',dataObj);
    }

    //active trip
    this.activateTrip = function (dataObj) { //create empty trip record
        console.log('Client::dataBaseService:: activate trip');
        return $http.post('/activateTrip',dataObj);
    };

    //track Config
    this.trackConfig = function (dataObj) { //create empty trip record
        console.log('Client::dataBaseService:: activate trip');
        return $http.post('/trackConfig',dataObj);
    };

    //Public trip
    this.trackConfig = function (dataObj) {
        console.log('Client::dataBaseService:: public trip');
        return $http.post('/publicTrip',dataObj);
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