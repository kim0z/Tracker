trackerApp.service('firebaseSvc', function ($firebaseArray) {

    var _syncArray;

    this.getPath = function (ref_url) {
        console.log('Firebase service - get path for URL: '+ ref_url);
        _syncArray= $firebaseArray(ref_url);
        _syncArray.$loaded().then(function(items) {
            return items;
        });
    };

});