/**
 * Created by karim on 26/09/2016.
 */

trackerApp.service('serverSvc', ['$http', function ($http) {

    this.getProviderToken = function (profile) {
        console.log('Client::dataBaseService:: auth0 - get probider token');
        return $http.post('/getProviderToken', profile);
    }


}]);





