trackerApp.service('messages', function () {

    var trip_id ='';
    var user='';

    this.saveTripID = function (id) {
        console.log('Messages service - save trip id');
        trip_id = id;
    };

    this.getTripID = function () {
        console.log('Messages service - get trip id');
        return trip_id;
    };

    this.saveUser = function (user) {
        console.log('Messages service - save user');
        this.user = user;
    };

    this.getUser = function () {
        console.log('Messages service - get user');
        return (this.user);
    };

});