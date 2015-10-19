trackerApp.service('messages', function () {

    var trip_id;

    this.saveTripID = function () {
        console.log('get trip id - Messages service');
        return trip_id;
    };

    this.getTripID = function () {
        console.log('save trip id - Messages service');
        return trip_id;
    };

});