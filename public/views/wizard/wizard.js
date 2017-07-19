/**
 * Created by karim on 10/04/2017.
 */
trackerApp.controller('wizard', function ($rootScope, $scope, $location, Upload, $timeout, $state, $stateParams, $window, $mdDialog, dataBaseService, localStorageService, Facebook) {

    console.log('wizard started with trip id: ', $stateParams);

    $scope.profile = localStorageService.get('profile');
    $scope.facebookId = $scope.profile.identities[0].user_id;

    $scope.userAccessToken = localStorageService.get('providerToken');

    if (!$stateParams.tripId || !$scope.facebookId) { //if no trip Id or user id then return back to My Trips page (I should understand when this happened?)
        console.log('Wizard:: exit because user id or trip id = null');
        console.log('user id:' + $scope.facebookId);
        console.log('trip id:' + $stateParams.tripId);
        $state.go('mytrips');
    }

    $scope.$on('$stateChangeSuccess',
        function (event, toState, toParams, fromState, fromParams) {
            //do nothing
        })

    $scope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
            if (toState.url == '/trip/:id') { //when user click finish and move to Trip page
                //do nothing
            } else {
                if ($location.path() != '/wizard') {
                    event.preventDefault();
                    $scope.showConfirm(toState);
                }
            }
        })

    $scope.trip = {};
    $scope.files = {};

    $scope.trip = {
        id: $stateParams.tripId,
        name: '',
        dateStart: '',
        dateEnd: '',
        description: '',
        type: '',
        continents: '',
        options: {trip_public: false}
    };

    $scope.trip.public = false;

    $scope.trip.buttonDisabled = true;

    //**** config - should be removed
    AWS.config.credentials = new AWS.Credentials('AKIAIGEOPTU4KRW6GK6Q', 'VERZVs+/nd56Z+/Qxy1mzEqqBwUS1l9D4YbqmPoO');

    // Configure your region
    AWS.config.region = 'us-west-2';

    var bucket = new AWS.S3({params: {Bucket: 'tracker.photos'}});


    $scope.map_center = {lat: 0, lng: 0};


    //***** config end

    $scope.finishWizard = function () {
        //$state.go('mytrips');
        window.open('#/trip/' + $stateParams.tripId, '_self', false);
    }


    $scope.showConfirm = function (toState) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .title('Would you like to cancel your trip?')
            .content('All the trip assets will be deleted.')
            .ariaLabel('Lucky day')
            .ok('Please do it!')
            .cancel('No, continue');

        $mdDialog.show(confirm).then(function () {
            $scope.cancel(toState);
        }, function () {
            //do nothing
        });
    };

    //Update trip with Manual flag, it means the trip was created manually by users and not using the recorder APP
    var firebase_update_manually = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/_trip');
    console.log('Wizard:: Firebase:: update trip meta data - Trip created manually');
    firebase_update_manually.set({trip_created_manually: true});

    $scope.cancel = function (toState) {

        //delete trip details and assets
        if ($scope.trip.id == '') {
            console.log('error:: Client:: New Trip Dialog:: Cancel trip creation, no trip id');
        } else {

            var dataTripId = {trip_id: $scope.trip.id};
            dataBaseService.deleteTripById(dataTripId).then(function (results) {

                console.log('Client:: Wizard:: Cancel trip creation :: Delete trip id:: ' + $scope.trip.id);

                //if the Cancel was by click cancel button then go to My Trips page
                if (toState != null) {
                    if (toState.hasOwnProperty('url')) {
                        $state.go(toState);
                    }else{
                        $state.go('mytrips');
                    }
                }
                else {
                    $state.go('mytrips');
                }

                //if user clicked on any other pages then go to the toState after alert to the user about it
            })

            function emptyBucket(callback) {
                //photos S3
                var params = {
                    // Bucket: 'tracker.photos',
                    Prefix: $scope.facebookId + '/' + $scope.trip.id + '/'
                }

                bucket.listObjects(params, function (err, data) {
                    if (err) return callback(err);

                    if (data.Contents.length == 0) return;

                    params = {Bucket: 'tracker.photos'};
                    params.Delete = {Objects: []};

                    data.Contents.forEach(function (content) {
                        params.Delete.Objects.push({Key: content.Key});
                    });

                    bucket.deleteObjects(params, function (err, data) {
                        if (err) return callback(err);
                        if (data.Deleted.length > 0)emptyBucket(callback);
                        else callback();
                    });
                });
            }

            emptyBucket();

            //tips and paths
            //Delete Firebase
            var firebase_trip_assets = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id);
            firebase_trip_assets.remove();
        }
    }
    //watch any change in input fields of details form, then check if all fields are not empty to enable Next button
    $scope.$watch('trip', function () {
        if ($scope.trip.name && $scope.trip.dateStart && $scope.trip.dateEnd && $scope.trip.continents && $scope.trip.type) {
            $scope.trip.buttonDisabled = false;
            console.log('Wizard: Trip details form is valid, Next button enabled');
            $scope.d = {d: ''}
            $scope.d.d = new Date($scope.trip.dateStart).toString();
        } else {
            $scope.trip.buttonDisabled = true;
        }
    }, true);

    // ************************** Trip details *************************
    $scope.addTrip = function () {

        var continents_lat_lng = {
            africa: {lat: '8.7832', lng: '34.5085'},
            europe: {lat: '54.5260', lng: '15.2551'},
            asia: {lat: '34.0479', lng: '100.6197'},
            middleEast: {lat: '29.2985', lng: '42.5510'},
            northAmerica: {lat: '54.5260', lng: '105.2551'},
            southAmerica: {lat: '8.7832', lng: '55.4915'},
            antarctica: {lat: '82.8628', lng: '135.0000'},
            australia: {lat: '25.2744', lng: '133.7751'}
        };

        switch ($scope.trip.continents) {
            case 'Africa':
                $scope.map_center = continents_lat_lng.africa;
                break;
            case 'Europe':
                $scope.map_center = continents_lat_lng.europe;
                break;
            case 'Asia':
                $scope.map_center = continents_lat_lng.asia;
                break;
            case 'Middle East':
                $scope.map_center = continents_lat_lng.middleEast;
                break;
            case 'North America':
                $scope.map_center = continents_lat_lng.northAmerica;
                break;
            case 'South America':
                $scope.map_center = continents_lat_lng.southAmerica;
                break;
            case 'Antarctica':
                $scope.map_center = continents_lat_lng.antarctica;
                break;
            case 'Australia':
                $scope.map_center = continents_lat_lng.australia;
                break;
        }
        //save all the general information about the trip
        var jsonTripGeneralInfo = {
            email: $scope.profile.email,
            trip_id: $scope.trip.id,
            trip_name: $scope.trip.name,
            trip_description: $scope.trip.description,
            start_date: $scope.trip.dateStart,
            end_date: $scope.trip.dateEnd,
            continent: $scope.trip.continents,
            profile_picture: $scope.profile.picture,
            facebook_id: $scope.facebookId,
            trip_type: $scope.trip.type,
            options: {trip_public: $scope.trip.public}
        };

        //updateMapCenter($scope.trip.continents);

        //save updated trip into DB
        dataBaseService.updateTripGeneralInfo(jsonTripGeneralInfo)
            .success(function (data, status, headers, config) {
                //$scope.message = data; //handle data back from server - not needed meanwhile
                console.log(jsonTripGeneralInfo);
            })
            .error(function (data, status, headers, config) {
                console.log("failure message: " + JSON.stringify({data: data}));
            });

        //upload cover photo to S3
        var fileChooser = document.getElementById('coverPhotoInput')
        var file_cover = fileChooser.files[0];

        var params = {
            Key: $scope.facebookId + '/' + $scope.trip.id + '/cover',
            ContentType: file_cover.type,
            Body: file_cover
        };

        bucket.upload(params, function (err, data) {
            console.log(err ? 'ERROR!' : 'Cover photo UPLOADED.');
        });
    };

    // ************************** Upload *******************************
    $scope.$watch('files', function () {
        $scope.upload($scope.files);
    });
    $scope.$watch('file', function () {
        if ($scope.file != null) {
            $scope.upload([$scope.file]);
        }
    });

    $scope.log = '';


    $scope.upload = function () {
        if ($scope.files.files && $scope.files.files.length) {
            for (var i = 0; i < $scope.files.files.length; i++) {
                var file = $scope.files.files[i];

                var params = {
                    Key: $scope.facebookId + '/' + $scope.trip.id + '/' + file.name,
                    ContentType: file.type,
                    Body: file
                };

                bucket.upload(params, function (err, data) {
                    console.log(err ? 'ERROR!' : 'UPLOADED.');
                });

                /*     Upload.upload({
                 url: 'https://s3-us-west-2.amazonaws.com/tracker.photos/', //S3 upload url including bucket name
                 method: 'POST',
                 data: {
                 key: $scope.facebookId + '/' + $scope.trip.id + '/' + file.name, // the key to store the file on S3, could be file name or customized
                 AWSAccessKeyId: 'AKIAIGEOPTU4KRW6GK6Q',
                 //acl: 'private', // sets the access to the uploaded file in the bucket: private, public-read, ...
                 //policy: $scope.policy, // base64-encoded json policy (see article below)
                 //signature: $scope.signature, // base64-encoded signature based on policy string (see article below)
                 "Content-Type": file.type, // != '' ? file.type : 'application/octet-stream', // content type of the file (NotEmpty)
                 //filename: file.name, // this is needed for Flash polyfill IE8-9
                 //file: file
                 body: file
                 }
                 }).progress(function (evt) {
                 var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                 $scope.log = 'progress: ' + progressPercentage + '% ' + evt.config.file.name + '\n' + $scope.log;
                 }).success(function (data, status, headers, config) {
                 $timeout(function () {
                 $scope.log = 'file: ' + config.file.name + ', Response: ' + JSON.stringify(data) + '\n' + $scope.log;
                 });
                 });*/
            }
        }
    }
    // ***************************** Places - Map drawing tracks *******************************
    $scope.startMapDrawing = function () {
        var iframe = document.getElementById('iframe_drawing');
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write('<div id="map_drawing" style="width: 100%; height: 100%"></div>');
        iframe.contentWindow.document.write('<input id="pac-input-drawing" class="form-control" type="text" placeholder="Search Location" style="width: 200px">');
        iframe.contentWindow.document.close();

        //Map configuration
        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = []; //var directionsDisplay = new google.maps.DirectionsRenderer;

        var mapContainer = iframe.contentWindow.document.querySelector('#map_drawing');

        $scope.map = new google.maps.Map(mapContainer, {
            //center: {lat: 34.397, lng: 40.644},
            center: new google.maps.LatLng($scope.map_center.lat, $scope.map_center.lng),
            zoom: 4,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.LEFT_TOP
            },
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
            },
            scaleControl: true,
            streetViewControl: false,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
            }
        });


        //Flags
        $scope.add_new_route_flag = false;

        //Prepare Google API nearbySearch
        var _gmapService = new google.maps.places.PlacesService($scope.map);

        function calculateAndDisplayRoute(directionsService, directionsDisplay, from, to) {
            directionsService.route({
                origin: from,
                destination: to,
                travelMode: 'DRIVING'
            }, function (response, status) {
                if (status === 'OK') {
                    var directionRenderer = new google.maps.DirectionsRenderer;
                    directionRenderer.id = directionsDisplay.length;
                    response.id = directionsDisplay.length;
                    directionsDisplay.push(directionRenderer);
                    directionsDisplay[directionsDisplay.length - 1].setMap($scope.map); //last added directionDisplay
                    directionsDisplay[directionsDisplay.length - 1].setDirections(response);

                    //save to Firebase under places (Manually added places - it's different from recorded path)
                    var firebase_drawing_markers_routes = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/routes');
                    console.log('new route added to firebase under /map/routes');
                    firebase_drawing_markers_routes.push(JSON.stringify(response));

                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
        }

        // ******************** Load routes when new route added and manage it in array to Delete later if needed **********************
        //Read places from Firebase (Manually added places - it's different from recorded path)
        var firebase_routes_for_route_list = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/routes');
        $scope.routes_list = [];
        firebase_routes_for_route_list.on("child_added", function (snapshot) {
            console.log('Wizrad:: Tips sections :: Reading new route from firebase under /map/routes');
            var route = JSON.parse(snapshot.val()); //JSON.parse(childSnapshot);
            route.firebase_key = snapshot.key();
            $scope.routes_list.unshift(route);

            //enable New Rout button after the user already have at least 1 route added
            if($scope.routes_list.length > 0){
                $scope.add_new_route_flag = true;
            }

            $scope.$apply();
        }, function (errorObject) {
            console.log("Trip:: Read trip routes from Firebase failed: " + errorObject.code);
        });

        $scope.new_route_separator = function () {
            //Separator between routs to allow routes to be disconnected
            var firebase_drawing_markers_routes_separator = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/routes');
            console.log('new route separator added to firebase under /map/routes');
            firebase_drawing_markers_routes_separator.push({separator: true}); //this will help in drawing mode

            //also add to markers to help in recognize in this view
            $scope.markers.push({separator: true});
        }

        //remove route from Firebase and route list
        $scope.removeRoute = function (route) {
            var firebase_routes_remove = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/routes');
            //delete from firebase
            firebase_routes_remove.child(route.firebase_key).remove();
            console.log('Wizard:: Places: Routes: Route removed from Firebase');

            //remove route from List
            $scope.routes_list.splice($scope.routes_list.length - 1, 1);
            console.log('Wizard:: Places: Routes: Route removed from list');

            //remove route from Map
            directionsDisplay[directionsDisplay.length - 1].setMap(null);
            directionsDisplay.splice(directionsDisplay.length - 1, 1);
            console.log('Wizard: Places : Routes: Disabled route from map');

            //remove last flag
            $scope.markers[$scope.markers.length - 1].setMap(null);
            //remove from array (list in UI)
            $scope.markers.splice($scope.markers.length - 1, 1);

            //remove first flag if it is the last one after delete routes
            if($scope.markers.length > 0){ //last flaf after delete
                $scope.markers[$scope.markers.length - 1].setMap(null);
                $scope.markers.splice($scope.markers.length - 1, 1);
            }
        }

        $scope.routes_settings = { enable_routes_map: true };

        $scope.routesOnMap = function(flag) {
            if(flag){ //if true then show routes on map
                for( var i = 0 ; i < directionsDisplay.length ; i++){
                    directionsDisplay[i].setMap($scope.map);
                }
            }else{ //if false then disable routen pn map
                for( var i = 0 ; i < directionsDisplay.length ; i++){
                    directionsDisplay[i].setMap(null);
                }
            }
        };

        // Create the search box and link it to the UI element.
        var input = iframe.contentWindow.document.querySelector('#pac-input-drawing');
        var searchBox = new google.maps.places.SearchBox(input);
        $scope.map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

        // Bias the SearchBox results towards current map's viewport.
        $scope.map.addListener('bounds_changed', function () {
            searchBox.setBounds($scope.map.getBounds());
        });

        var markers_searh = [];
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function () {
            var places = searchBox.getPlaces();

            if (places.length == 0) {
                return;
            }

            // Clear out the old markers.
            markers_searh.forEach(function (marker) {
                marker.setMap(null);
            });
            markers_searh = [];

            // For each place, get the icon, name and location.
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function (place) {
                if (!place.geometry) {
                    console.log("Returned place contains no geometry");
                    return;
                }
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };

                // Create a marker for each place.
                markers_searh.push(new google.maps.Marker({
                    map: $scope.map,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location
                }));

                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            $scope.map.fitBounds(bounds);
        });

        var drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: google.maps.drawing.OverlayType.MARKER,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.RIGHT_TOP,
                drawingModes: ['marker'] //, 'circle', 'polygon', 'polyline', 'rectangle']
            },
            markerOptions: {icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'}
        });

        drawingManager.setMap($scope.map);


        // %%%% Listeners to save drawing data to firebase %%%%
        $scope.circles = [];
        $scope.markers = [];
        $scope.polylines = [];

        //////circles
        var firebase_drawing_circles = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/circles');
        google.maps.event.addDomListener(drawingManager, 'circlecomplete', function (circle) {
            console.log('new circle added to firebase');
            firebase_drawing_circles.push({
                //strokeWeight: circle.strokeWeight,
                //fillColor: circle.fillColor,
                //fillOpacity: circle.fillOpacity,
                radius: circle.radius,
                center: {lat: circle.center.lat(), lng: circle.center.lng()}
            });

            //draw the circle directlly (no need to read again all items from firebase)
            circle.set("id", "New circle");
            $scope.circles.push(circle);
            $scope.$apply();
        });

        firebase_drawing_circles.once("value", function (snapshot) {
            //console.log('reading circles from firebase to load it to map');
            snapshot.forEach(function (childSnapshot) {
                var circle = new google.maps.Circle({
                    //strokeWeight: childSnapshot.val().strokeWeight,
                    //fillColor: childSnapshot.val().fillColor,
                    //fillOpacity: childSnapshot.val().fillOpacity,
                    map: $scope.map,
                    center: childSnapshot.val().center,
                    radius: childSnapshot.val().radius,
                    id: childSnapshot.key(),
                    type: 'circle'
                });
                //push to scope: 1. manage items 2. show as a list 3. delete item 4. update item
                $scope.circles.push(circle);

                //$scope.circles.push({key: childSnapshot.key(), val: childSnapshot.val()});
            });
        }, function (errorObject) {
            console.log("Read circles from Firebase failed: " + errorObject.code);
        });
        ////// Circles END

        ////// Markers / Places

        //Get places from Firebase to the list in HTML, keep listening to the new places added by user
        $scope.nearbyPlaces = [];

        //Read places from Firebase when a new place added to show it in the list / edit / delete
        var firebase_places = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/places');
        var firebase_places_remove = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/places');
        firebase_places.on("child_added", function (snapshot) {
            //snapshot.forEach(function (childSnapshot) {
            var place = JSON.parse(snapshot.val());
            place["firebase_key"] = snapshot.key();
            $scope.nearbyPlaces.push(place);
            console.log('Wizard:: Reading place from Firebase');
            //});
            $scope.$apply();
        })

        $scope.removePlace = function (key) {
            firebase_places_remove.child(key).remove();
            for (var i = 0; i < $scope.nearbyPlaces.length; i++) {
                if ($scope.nearbyPlaces[i].firebase_key == key) {
                    $scope.nearbyPlaces.splice(i, 1);
                    console.log('Wizard:: Place was removed');
                    break;
                }
            }
        }
        //Listen to user map event, when click to add marker then calculate route + get place details (could be more than 1 place)
        var firebase_drawing_markers = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/markers');
        var firebase_places = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/places');
        google.maps.event.addDomListener(drawingManager, 'markercomplete', function (marker) {
            console.log('new marker / place added to firebase');
            var _nearbyPlaces = [];
            var _detailsPlaces = [];

            //console.log(marker);
            firebase_drawing_markers.push({
                icon: marker.icon,
                position: {lat: marker.position.lat(), lng: marker.position.lng()}
            });

            //draw the marker directly (no need to read again all items from firebase)
            marker.set("id", "New marker");
            $scope.markers.push(marker);

            //get route
            //check if new route required, new route means: first route in map Or the user choose to disconnect route
            //if ($scope.markers.length > 1) { // wait to the second point to get thr route
            if($scope.markers.length > 1){
                if(!$scope.markers[$scope.markers.length - 2].hasOwnProperty("separator")){
                    calculateAndDisplayRoute(directionsService, directionsDisplay, $scope.markers[$scope.markers.length - 2].position, $scope.markers[$scope.markers.length - 1].position);
                }
            }

            //////////////// Facebook API get places around ///////////////////////
            //Get places name, Facebook API, bring pages around
            var getPlacesByFacebook = function (lat, lng, distance, limit) {
                if (lat != null && lng != null && distance != null) {
                    Facebook.api(
                        "search?access_token=942317529184852%7CXgVb4d3OEZDe9VM1ilqo-u53-4U&pretty=0&q&type=place&center=" + lat + "," + lng + "&distance=" + distance + "&limit=" + limit + "&after=MjQZD&fields=name,checkins,picture,link", //APP Token
                        function (places) {
                            if (places && !places.error) {
                                //console.log(places);
                                for (var i = 0; i < places.data.length; i++) {
                                    //_detailsPlaces.push(places.data[i]);
                                    //console.log(places.data[i])
                                    var place = places.data[i];
                                    place.location = {lat: lat, lng: lng};
                                    firebase_places.push(JSON.stringify(place));
                                }
                            }
                        });
                } else {
                    console.log('Wizard:: Error:: lat || lng || distance == null');
                }
            }
            ///////////////////  Facebook Places API END /////////////////////////////

            ////////// Google API - Get places around /////////////////
            var getPlaceDetails = function () {
                //Get Details for places
                for (var i = 0; i < _nearbyPlaces.length; i++) {
                    var request = {
                        placeId: _nearbyPlaces[i].place_id
                    };
                    _gmapService.getDetails(request, function (place_details, status) {

                        if (status == google.maps.places.PlacesServiceStatus.OK) {
                            console.log('Wizard:: Places Details:');
                            _detailsPlaces.push(place_details);
                            console.log(place_details)
                            firebase_places.push(JSON.stringify(place_details));
                        } else {
                            console.log('Wizard:: Places Details: 0, no details for the place');
                        }
                    });
                }
            }
            var request = {
                location: {
                    lat: marker.position.lat(),
                    lng: marker.position.lng()
                },
                radius: '10',
                types: []
            };

            var getPlacesByGoogle = function () {
                _gmapService.nearbySearch(request, function (results, status) {
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        for (var i = 0; i < results.length; i++) {
                            var place = results[i];
                            console.log('Wizard:: Places near by:')
                            console.log(place);
                            _nearbyPlaces.push(place);

                            //Get Details
                            getPlaceDetails();
                        }
                    } else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        console.log('Wizard:: Places near by: 0, no places')
                    }
                });
            }
            /////////////////// Google places API End ///////////////////////////////////
            $scope.places_settings = {};
            $scope.places_settings.facebook_distance = 300;
            $scope.places_settings.facebook_limit = 5;

            //get places around
            getPlacesByFacebook(marker.position.lat(), marker.position.lng(), $scope.places_settings.facebook_distance, $scope.places_settings.facebook_limit);
            //getPlacesByGoogle(); //enable to allow Google places to work

            //$scope.$apply();
        });


        firebase_drawing_markers.once("value", function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                //console.log('reading markers from firebase to load it to map');
                //console.log(childSnapshot.val()); // childData = location and message and time
                var marker = new google.maps.Marker({
                    map: $scope.map,
                    position: childSnapshot.val().position,
                    icon: childSnapshot.val().icon,
                    id: childSnapshot.key(),
                    type: 'marker'
                });
                //$scope.markers.push({key: childSnapshot.key() , val: childSnapshot.val() });
                //push to scope: 1. manage items 2. show as a list 3. delete item 4. update item
                $scope.markers.push(marker);

            });
        }, function (errorObject) {
            console.log("Read markers from Firebase failed: " + errorObject.code);
        });
        /////// Markers END

        // polyline
        var firebase_drawing_polyline = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/polylines');
        google.maps.event.addDomListener(drawingManager, 'polylinecomplete', function (polyline) {
            console.log('new polyline added to firebase');
            //console.log(polyline.getPath());

            polyline.set("id", "New polyline");
            polyline.set("key", "e444");

            $scope.polylines.push(polyline);
            $scope.$digest();

            var polyline_path = [];
            polyline.getPath().forEach(function (element) {
                polyline_path.push({lat: element.lat(), lng: element.lng()});
            });
            //save into firebase
            firebase_drawing_polyline.push(polyline_path);

            //draw the polyline directlly (no need to read again all items from firebase)
            $scope.polylines.push(polyline);
            $scope.$apply();
        });

        firebase_drawing_polyline.once("value", function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                //console.log('reading polylines from firebase to load it to map');
                //console.log(childSnapshot.val()); // childData = location and message and time

                var polyline_path = childSnapshot.val();
                var polyline = new google.maps.Polyline({
                    map: $scope.map,
                    path: polyline_path,
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    id: childSnapshot.key(),
                    type: 'polyline'
                });
                //$scope.polylines.push({key: childSnapshot.key(), val:childSnapshot.val()});
                //push to scope: 1. manage items 2. show as a list 3. delete item 4. update item
                $scope.polylines.push(polyline);

            });
        }, function (errorObject) {
            console.log("Read polylines from Firebase failed: " + errorObject.code);
        });

        /////// polyline END

        //Delete items from map
        $scope.deleteItemFromMap = function (type, key) {

            if (type == 'marker') {
                for (var i = 0; i < $scope.markers.length; i++) {
                    if ($scope.markers[i].get("id") == key) {
                        //remove item from view
                        $scope.markers[i].setMap(null);
                        $scope.markers.splice(i, 1);
                        //remove item from firebase
                        firebase_drawing_markers.child(key).remove();
                        console.log('delete item from map, type: ' + type + ' key: ' + key + ' done');
                    }
                }
            }
            if (type == 'circle') {
                for (var i = 0; i < $scope.circles.length; i++) {
                    if ($scope.circles[i].get("id") == key) {
                        //remove item from view
                        $scope.circles[i].setMap(null);
                        $scope.circles.splice(i, 1);
                        //remove item from firebase
                        firebase_drawing_circles.child(key).remove();
                        console.log('delete item from map, type: ' + type + ' key: ' + key + ' done');
                    }
                }
            }
            if (type == 'polyline') {
                for (var i = 0; i < $scope.polylines.length; i++) {
                    if ($scope.polylines[i].get("id") == key) {
                        //remove from view
                        $scope.polylines[i].setMap(null);
                        $scope.polylines.splice(i, 1);
                        //remove from firebase
                        firebase_drawing_polyline.child(key).remove();
                        console.log('delete item from map, type: ' + type + ' key: ' + key + ' done');
                    }
                }
            }
        }

        $scope.highLightItem = function (type, key) {
            if (type == 'marker') {
                for (var i = 0; i < $scope.markers.length; i++) {
                    if ($scope.markers[i].get("id") == key) {

                        console.log('highlight item in map, type: ' + type + ' key: ' + key + ' done');
                    }
                }
            }
            if (type == 'circle') {
                for (var i = 0; i < $scope.circles.length; i++) {
                    if ($scope.circles[i].get("id") == key) {

                        console.log('highlight item in map, type: ' + type + ' key: ' + key + ' done');
                    }
                }
            }
            if (type == 'polyline') {
                for (var i = 0; i < $scope.polylines.length; i++) {
                    if ($scope.polylines[i].get("id") == key) {
                        //change color
                        var current_color = $scope.polylines[i].get("strokeColor");
                        $scope.polylines[i].set("strokeColor", "51fe0d");

                        //zoom on item
                        //get polyline path
                        var poly_path = $scope.polylines[i].getPath();

                        //get 1 point from path
                        var location = poly_path.pop();

                        $scope.map.setCenter(location);
                        console.log('highlight item in map, type: ' + type + ' key: ' + key + ' done');
                    }
                }
            }
        }
        // ****************************** Drawing events end *******************************
    }


    // *************************** Trip tips on map **************************
    $scope.startMapTips = function () {

        //Map configuration
        var iframe = document.getElementById('iframe_tips');
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write('<div id="map_tips" style="width: 100%; height: 100%"></div>');
        iframe.contentWindow.document.write('<input id="pac-input-tips" class="form-control" type="text" placeholder="Search Location" style="width: 200px">');
        iframe.contentWindow.document.close();

        var mapContainer = iframe.contentWindow.document.querySelector('#map_tips');

        $scope.map_tips = new google.maps.Map(mapContainer, {
            center: new google.maps.LatLng($scope.map_center.lat, $scope.map_center.lng),
            zoom: 4,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.LEFT_TOP
            },
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
            },
            scaleControl: true,
            streetViewControl: false,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
            }
        });

        // Create the search box and link it to the UI element.
        //var input = document.getElementById('pac-input_tips');
        var input = iframe.contentWindow.document.querySelector('#pac-input-tips');
        var searchBox = new google.maps.places.SearchBox(input);
        $scope.map_tips.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

        // Bias the SearchBox results towards current map's viewport.
        $scope.map_tips.addListener('bounds_changed', function () {
            searchBox.setBounds($scope.map_tips.getBounds());
        });

        var markers_searh = [];
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function () {
            var places = searchBox.getPlaces();

            if (places.length == 0) {
                return;
            }

            // Clear out the old markers.
            markers_searh.forEach(function (marker) {
                marker.setMap(null);
            });
            markers_searh = [];

            // For each place, get the icon, name and location.
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function (place) {
                if (!place.geometry) {
                    console.log("Returned place contains no geometry");
                    return;
                }
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };

                // Create a marker for each place.
                markers_searh.push(new google.maps.Marker({
                    map: $scope.map_tips,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location
                }));

                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            $scope.map_tips.fitBounds(bounds);
        });

        $scope.message = {};
        //Listener to click on map to get GPS
        $scope.map_tips.addListener('click', function (e) {
            $scope.message = {lat: e.latLng.lat(), lng: e.latLng.lng(), time: new Date()};
            $scope.$apply(); //used to update 'add tips right side of the map', but why it doesn't update without it ????
        });

        //********** Load places to allow user to see what places to add tips on *************
        $scope.markers_tips = [];
        var firebase_markers_for_tips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/markers');
        firebase_markers_for_tips.once("value", function (snapshot) {
            snapshot.forEach(function (childSnapshot) {
                //console.log('reading markers from firebase to load it to map');
                //console.log(childSnapshot.val()); // childData = location and message and time
                var marker = new google.maps.Marker({
                    map: $scope.map_tips,
                    position: childSnapshot.val().position,
                    icon: childSnapshot.val().icon,
                    id: childSnapshot.key(),
                    type: 'marker'
                });
                //$scope.markers.push({key: childSnapshot.key() , val: childSnapshot.val() });
                //push to scope: 1. manage items 2. show as a list 3. delete item 4. update item
                $scope.markers_tips.push(marker);
            });
        }, function (errorObject) {
            console.log("Read markers from Firebase failed: " + errorObject.code);
        });

        // ******************** Load routes **********************
        //Read places from Firebase (Manually added places - it's different from recorded path)
        var firebase_routes_for_tips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/routes');
        //firebase_drawing_markers_routes.push(JSON.stringify(response));

        firebase_routes_for_tips.once("value", function (snapshot) {
            //create direction Service and Display
            var directionsService = new google.maps.DirectionsService;
            var directionsDisplay = []; //var directionsDisplay = new google.maps.DirectionsRenderer;

            snapshot.forEach(function (childSnapshot) {
                if(!childSnapshot.val().hasOwnProperty("separator")){
                    console.log('Wizrad:: Tips sections :: Reading new route from firebase under /map/routes');
                    var route = JSON.parse(childSnapshot.val()); //JSON.parse(childSnapshot);
                    //console.log(route);
                    directionsDisplay.push(new google.maps.DirectionsRenderer);
                    directionsDisplay[directionsDisplay.length - 1].setMap($scope.map_tips); //last added directionDisplay
                    directionsDisplay[directionsDisplay.length - 1].setDirections(route);
                }
            });
        }, function (errorObject) {
            console.log("Trip:: Read trip routes from Firebase failed: " + errorObject.code);
        });

        //**********************  load Tips from Firebase ******************
        var firebase_ref_readTips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/messages');

        firebase_ref_readTips.on("value", function (snapshot) {
            $scope.messages = [];
            snapshot.forEach(function (childSnapshot) {
                var key = childSnapshot.key();
                var childData = childSnapshot.val();
                childData.key = key;
                console.log("Read Tips from Firebase to show on map: " + childData);
                $scope.messages.unshift(childData);
            });
            //$scope.$apply();
        }, function (errorObject) {
            console.log("Read Tips from Firebase failed: " + errorObject.code);
        });


        //delete tip from list
        $scope.remove_tip = function (tip) {
            var firebase_ref_readTips_remove = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/messages');
            firebase_ref_readTips_remove.child(tip.key).remove();

            //remove from list
           /* for(var i = 0 ; i < $scope.messages.length ; i++){
                if($scope.messages.key == tip.key){
                    $scope.messages.splice(i, 1);
                }
            }*/
            $scope.$apply();

        }
        //Add new tip
        $scope.addMessage = function () {
            // add a new note to firebase
            var message_json = {};

            var firebase_tips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/messages');

            var location = {coords: {latitude: $scope.message.lat, longitude: $scope.message.lng}};
            message_json = {
                location: location,
                time: $scope.message.time,
                email: '',
                message: {tip: $scope.message.text, invite: '', risk: '', price: ''}
            };

            firebase_tips.push(message_json);
            console.log('New Tip saved in Firebase');

            $scope.message.lat = '';
            $scope.message.lng = '';
            $scope.message.time = '';
            $scope.message.text = '';

        }
    }

    // ************************** Start expense view *********************************
    $scope.startExpense = function () {



        $scope.expense = {};
        $scope.expense.type = ['Select Expense Type','Flight','Hotel', 'Car', 'Meal', 'Medical', 'Taxi', 'Attractions'];
        $scope.expense.currency = ['USD', 'Euro', 'GBP'];

        $scope.user = {};
        $scope.user.type = $scope.expense.type[0];
        $scope.user.currency = $scope.expense.currency[0];
        $scope.user.cost = 0;



        //Load expense
        var firebase_expense_load = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/expense');
        var firebase_expense_remove = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/expense');
        //firebase_drawing_markers_routes.push(JSON.stringify(response));

        $scope.list_expense = [];

        firebase_expense_load.on("child_added", function (snapshot) {
                var expense_item = snapshot.val();
                expense_item.firebase_key = snapshot.key();
                $scope.list_expense.push(expense_item);
        });

        $scope.removeExpense = function (key) {
            firebase_expense_remove.child(key).remove();
            for (var i = 0; i < $scope.list_expense.length; i++) {
                if ($scope.list_expense[i].firebase_key == key) {
                    $scope.list_expense.splice(i, 1);
                    console.log('Wizard:: Remove expense item');
                    break;
                }
            }
        }

        //trip days
        var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
        var firstDate = new Date($scope.trip.dateStart);
        var secondDate = new Date($scope.trip.dateEnd);

        $scope.tripDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));


        $scope.addExpense = function () {
            if($scope.user.type != '' && $scope.user.currency != '' && $scope.user.cost != ''){
                var firebase_expense = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/expense');
                var expense = {type: $scope.user.type, currency: $scope.user.currency, cost: $scope.user.cost};
                firebase_expense.push(expense);
                console.log('New expense saved in Firebase');

                $scope.user.type = '';
                $scope.user.currency = '';
                $scope.user.cost = 0;

            }
        };


        $scope.getDateAfter = function (days) {
            //convert date to object to allow me do action on it like increase the date in the table
            //var startDate = date;
            var dateInNumberFormat = new Date(firstDate).getTime();
            //create array for the dates to show it on table, each cell will have 1 extra day
            //var day = 1000 * 3600 * 24; //day in miliseconds 1000 * 3600 = hour
            var month = new Date(dateInNumberFormat).getUTCMonth() + 1; //months from 1-12
            var day = new Date(dateInNumberFormat).getUTCDate();
            var year = new Date(dateInNumberFormat).getUTCFullYear();
            //$scope.dates[0] = month + '/' + day + '/' + year;

            //  for (var i = 1; i < daysSum; i++) {
            var anotherDay = 1000 * 3600 * (days * 24);
            //$scope.dates[i] = new Date(dateInNumberFormat + day).toString("MMMM yyyy");

            var month = new Date(dateInNumberFormat + anotherDay).getUTCMonth() + 1; //months from 1-12
            var day = new Date(dateInNumberFormat + anotherDay).getUTCDate();
            var year = new Date(dateInNumberFormat + anotherDay).getUTCFullYear();
            var nextDate = month + '/' + day + '/' + year;
            return nextDate;
        }

        $scope.getNumber = function (num) {
            return new Array(num);
        }
    }
});

