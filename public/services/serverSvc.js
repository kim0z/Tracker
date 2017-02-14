/**
 * Created by karim on 26/09/2016.
 */

trackerApp.service('serverSvc', ['$http', function($http) {

    this.getProviderToken = function(profile) {
        console.log('Client::dataBaseService:: auth0 - get probider token');
        return $http.post('/getProviderToken', profile);
    }

    this.getPhotoMetadata = function(imgUrl) {
        console.log('Client::get metadata EXIF from photo');
        return $http.post('/getPhotoMetadata', {img: imgUrl});
        /*
        return $http({
            url: '/getPhotoMetadata',
            method: "GET",
            params: { img: imgUrl }
        });
        */
    }

}]);
