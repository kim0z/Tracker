/**
 * Created by karim on 29/06/2017.
 */
trackerApp.service('nearbyPlacesFacebook', ['$rootScope', '$http', 'Facebook', function($rootScope, $http, Facebook) {

    var places;

    this.runNerarbyPlaces = function(path) {
        console.log('Service::Nearby Places By Facebook');
        //get points with time diff
        _interestPoints = getInterestPointsFromPath(path);

        var promises = [];
        for (var i = 0; i < _interestPoints.length; i++) {
            promises.push(getPlacesByFacebook(_interestPoints[i].lat, _interestPoints[i].lng, 50, 5));
        }
        Promise.all(promises).then(function(data) {
            places = data;
            $rootScope.$broadcast('facebook-places-ready');
        }, function(err) {
            // error occurred
        });



     /*   for(var i = 0 ; i < _interestPoints.length ; i++){
            if(_interestPoints[i].lat != null && _interestPoints[i].lng != null){
               places =  getPlacesByFacebook(_interestPoints[i].lat, _interestPoints[i].lng, 50, 5);
            }
        }*/
    }

    this.getNerarbyPlaces = function() {
        console.log('Service::Nearby Places By Facebook');
        return places;
    }

    var getPlacesByFacebook = function (lat, lng, distance, limit) {
        var places_array = [];
        if (lat != null && lng != null && distance != null) {
            return Facebook.api(
                "search?access_token=942317529184852%7CXgVb4d3OEZDe9VM1ilqo-u53-4U&pretty=0&q&type=place&center=" + lat + "," + lng + "&distance=" + distance + "&limit=" + limit + "&after=MjQZD&fields=name,checkins,picture,link", //APP Token
                function (places) {
                /*    if (places && !places.error) {
                        for (var i = 0; i < places.data.length; i++) {
                            //console.log(places.data[i]);
                            places_array.push(places.data[i]);
                        }
                    }*/
                });
        } else {
            console.log('Wizard:: Error:: lat || lng || distance == null');
        }
    }

    function getInterestPointsFromPath(path) {
        var placeStayingTime, interestPoints = [];
        for (var i = 0; i < path.length - 1; i++) {
            for(var j = 0; j < path[i].length ; j++ ){
                if(path[i + 1][j] && path[i + 1][j]['timestamp']){
                    placeStayingTime = (((new Date(path[i + 1][j]['timestamp']).getTime() - new Date(path[i][j]['timestamp']).getTime()) / 1000) / 60);
                    if (placeStayingTime > 10) {
                        interestPoints.push(path[i][j]);
                    }
                }
            }
        }
        return interestPoints;
    }

}]);
