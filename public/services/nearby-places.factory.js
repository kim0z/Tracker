trackerApp.factory('nearbyPlacesFactory', [
    '$q',
    '$timeout',
    'EventsDispatcher',
    function ($q,
              $timeout,
              EventsDispatcher) {

        function nearbyPlacesFactory(mapElement, pathData) {
            var _eventsDispatcher = new EventsDispatcher(),
                _interestPoints = getInterestPointsFromPath(pathData),
                _gmapService = new google.maps.places.PlacesService(mapElement),
                _nearbyPlaces,
                _nearbyPlacesIdsArray,
                _iterateOverPathProgress,
                _iterateOverNearbyPlacesProgress,
                _ready,
                _throttlingWait = 500;

            function iterateOverInterestPoints(interestPoints) {
                var deferred = $q.defer();

                function done() {
                    ////// done clean /////
                    interestPoints.splice(0, 1);
                    _iterateOverPathProgress = Math.floor(100 - (interestPoints.length / _interestPoints.length * 100));
                    _eventsDispatcher.dispatch('iterateOverPathProgress', _iterateOverPathProgress);
                    iterateOverInterestPoints(interestPoints)
                        .then(function () {
                            deferred.resolve();
                        })
                        .catch(function (err) {
                            deferred.reject(err);
                        });
                    ///////////////////////
                }

                if (interestPoints[0]) {
                    $timeout(function () {
                        var request = interestPoints[0];
                        // do your job here
                        _gmapService.nearbySearch(request, function (results, status) {
                            if (status == google.maps.places.PlacesServiceStatus.OK) {
                                for (var i = 0; i < results.length; i++) {
                                    var place = results[i];
                                    _nearbyPlaces[place.place_id] = 0;
                                }
                                done();
                            } else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                                done();
                            } else {
                                deferred.reject(status);
                            }
                        });
                    }, _throttlingWait);
                } else {
                    deferred.resolve();
                }
                return deferred.promise;
            }

            function iterateOverNearbyPlaces(nearbyPlacesIdsArray) {
                var deferred = $q.defer();

                function done() {
                    ////// done clean /////
                    nearbyPlacesIdsArray.splice(0, 1);
                    _iterateOverNearbyPlacesProgress = Math.floor(100 - (nearbyPlacesIdsArray.length / _nearbyPlacesIdsArray.length * 100));
                    _eventsDispatcher.dispatch('iterateOverNearbyPlacesProgress', _iterateOverNearbyPlacesProgress);
                    iterateOverNearbyPlaces(nearbyPlacesIdsArray)
                        .then(function () {
                            deferred.resolve();
                        })
                        .catch(function (err) {
                            deferred.reject(err);
                        });
                    ///////////////////////
                }

                if (nearbyPlacesIdsArray[0]) {
                    $timeout(function () {
                        var request = {
                            placeId: nearbyPlacesIdsArray[0]
                        };
                        // do your job here
                        _gmapService.getDetails(request, function (place_details, status) {

                            if (status == google.maps.places.PlacesServiceStatus.OK) {
                                _nearbyPlaces[nearbyPlacesIdsArray[0]] = place_details;
                                done();
                            } else {
                                deferred.reject(status);
                            }
                        });
                    }, _throttlingWait);
                } else {
                    deferred.resolve();
                }
                return deferred.promise;
            }

            this.on = _eventsDispatcher.on;

            this.init = function () {
                _ready = false;
                _iterateOverPathProgress = 0;
                _iterateOverNearbyPlacesProgress = 0;
                _nearbyPlaces = {};
                return iterateOverInterestPoints(_interestPoints.slice())
                    .then(function () {
                        _nearbyPlacesIdsArray = Object.keys(_nearbyPlaces);
                        return iterateOverNearbyPlaces(_nearbyPlacesIdsArray.slice());
                    })
                    .then(function () {
                        _eventsDispatcher.dispatch('ready', 1);
                    })
                    .catch(function(err) {
                        _eventsDispatcher.dispatch('error', err);
                    });
            }

            this.nearbyPlaces = function () {
                return _nearbyPlaces;
            };
        }

        function getInterestPointsFromPath(pathData) {
            var placeStayingTime, interestPoints = [];
            for (var i = 0; i < pathData.length - 1; i++) {
                for(var j = 0; j < pathData[i].length ; j++ ){
                    if(pathData[i + 1][j] && pathData[i + 1][j]['timestamp']){
                        placeStayingTime = (((new Date(pathData[i + 1][j]['timestamp']).getTime() - new Date(pathData[i][j]['timestamp']).getTime()) / 1000) / 60);
                        if (placeStayingTime > 10) {
                            console.log(pathData[i][j]['lat']);
                            var request = {
                                location: {
                                    lat: pathData[i][j]['lat'],
                                    lng: pathData[i][j]['lng']
                                },
                                radius: '1'
                            };
                            interestPoints.push(request);
                        }
                    }
                }
            }
            return interestPoints;
        }
/*

        function checkIfPlacesAlreadySaved() {
            //check if places saved
            var ref_places = new Firebase('https://luminous-torch-9364.firebaseio.com/web/users/' + $scope.facebookId + '/' + $scope.tripID);
            ref_places.once('value', function (snapshot) {
                if (snapshot.hasChild('places')) {
                    console.log('Places exists');
                    //read from Firebase
                    var ref_places = rootRef.child("places");
                    ref_places.once("value", function (snapshot) {
                        snapshot.forEach(function (child) {
                            console.log(child.val());
                        });
                    });
                }else{
                }
            });
        }
*/

        return nearbyPlacesFactory;

    }]);
