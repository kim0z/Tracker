trackerApp.service('messages', function ($rootScope) {

    var trip_id ='';
    var user='';
    var email='';
    var prevSatate = 'welcome';
    var lastState = '';
    var path = []; // for debug
    var trip_loading_progress = 1;

    this.saveTripID = function (id) {
        console.log('Messages service - save trip id');
        trip_id = id;
    };

    this.getTripID = function () {
        console.log('Messages service - get trip id');
        return trip_id;
    };

    this.saveUser = function (user) {
        console.log('Messages service - save user:' + user);
        user = user.name;
        email = user.email;
    };

    this.getUser = function () {
        console.log('Messages service - get user: '+ user);
        return user;
    };

    this.getUserEmail = function () {
        console.log('Messages service - get user email: '+ email);
        return email;
    };

    this.savePrevState = function (currentState, toState) {
        console.log('Messages service - Prev stat :', currentState);
        if(currentState.name){
            prevSatate = currentState.name;
            lastState = toState.name;
        }
    };

    this.getPrevState = function () {
        console.log('Messages service - get Prev stat: ', prevSatate);
        return prevSatate;
    };

    //console
    this.savePath = function (allSteps) {
        //console.log('Messages service - save all steps (for debugging - console) : ', allSteps);
        path = allSteps;
    };

    //console
    this.getPath = function () {
        //console.log('Messages service - get steps (for debugging - console) : ', steps);
        return path;
    };

    //Trip progressbar Set
    this.setTripProgress = function (val) {
        //console.log('Messages service - save all steps (for debugging - console) : ', allSteps);
        trip_loading_progress = val;
        $rootScope.$broadcast('trip_loading_progress', trip_loading_progress);
    };

    //Trip progressbar Get
    this.getTripProgress = function () {
        //console.log('Messages service - get steps (for debugging - console) : ', steps);
        return trip_loading_progress;
    };
});