/**
 * Created by karim on 10/04/2017.
 */
trackerApp.controller('wizard', function ($scope, Upload, $timeout, $state, $stateParams, $window, $mdDialog, dataBaseService, localStorageService) {

    console.log('wizard started with trip id: ', $stateParams);

    $scope.trip = {};
    $scope.files = {};

    $scope.trip.id = $stateParams.tripId;
    $scope.profile = localStorageService.get('profile');
    $scope.facebookId = $scope.profile.identities[0].user_id;

    $scope.trip.public = false;

    //**** config - should be removed
    AWS.config.credentials = new AWS.Credentials('AKIAIGEOPTU4KRW6GK6Q', 'VERZVs+/nd56Z+/Qxy1mzEqqBwUS1l9D4YbqmPoO');

    // Configure your region
    AWS.config.region = 'us-west-2';

    var bucket = new AWS.S3({params: {Bucket: 'tracker.photos'}});


    //***** config end

    $scope.finishWizard = function () {
        $state.go('mytrips');
    }


    $scope.showConfirm = function(ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .title('Would you like to cancel your trip?')
            .content('All the trip assets will be deleted.')
            .ariaLabel('Lucky day')
            .targetEvent(ev)
            .ok('Please do it!')
            .cancel('No, continue');

        $mdDialog.show(confirm).then(function() {
            $scope.cancel();
        }, function() {
            //do nothing
        });
    };


    $scope.cancel = function () {

        //delete trip details and assets
        if ($scope.trip.id == '') {
            console.log('error:: Client:: New Trip Dialog:: Cancel trip creation, no trip id');
        } else {

            var dataTripId = {trip_id: $scope.trip.id};
            dataBaseService.deleteTripById(dataTripId).then(function (results) {

                console.log('Client:: Wizard:: Cancel trip creation :: Delete trip id:: ' + $scope.trip.id);
                $state.go('mytrips');
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

    // ************************** Trip details *************************
    $scope.addTrip = function () {

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

        //save updated trip into DB
        dataBaseService.updateTripGeneralInfo(jsonTripGeneralInfo)
            .success(function (data, status, headers, config) {
                //$scope.message = data; //handle data back from server - not needed meanwhile
                console.log(jsonTripGeneralInfo);
            })
            .error(function (data, status, headers, config) {
                console.log("failure message: " + JSON.stringify({data: data}));
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
                    console.log( err ? 'ERROR!' : 'UPLOADED.');
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


    // ***************************** Map drawing tracks *******************************
    $scope.startMapDrawing = function () {
        //Map configuration
        $scope.map = new google.maps.Map(document.getElementById('map_tracks'), {
            //center: {lat: 34.397, lng: 40.644},
            center: {lat: 0, lng: 0},
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
        var input = document.getElementById('pac-input_tracks');
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
                drawingModes: ['marker', 'circle', 'polygon', 'polyline', 'rectangle']
            },
            markerOptions: {icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'},
            circleOptions: {
                fillColor: '#ffff00',
                fillOpacity: 1,
                strokeWeight: 5,
                clickable: false,
                editable: true,
                zIndex: 1
            }
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
                strokeWeight: circle.strokeWeight,
                fillColor: circle.fillColor,
                fillOpacity: circle.fillOpacity,
                radius: circle.radius,
                center: {lat: circle.center.lat(), lng: circle.center.lng()}
            });

            //draw the circle directlly (no need to read again all items from firebase)
            circle.set("id","New circle");
            $scope.circles.push(circle);
            $scope.$apply();
        });

        firebase_drawing_circles.once("value", function (snapshot) {
            //console.log('reading circles from firebase to load it to map');
            snapshot.forEach(function (childSnapshot) {
                var circle = new google.maps.Circle({
                    strokeWeight: childSnapshot.val().strokeWeight,
                    fillColor: childSnapshot.val().fillColor,
                    fillOpacity: childSnapshot.val().fillOpacity,
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

        ////// Markers
        var firebase_drawing_markers = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/map/markers');
        google.maps.event.addDomListener(drawingManager, 'markercomplete', function (marker) {
            console.log('new marker added to firebase');
            //console.log(marker);
            firebase_drawing_markers.push({
                icon: marker.icon,
                position: {lat: marker.position.lat(), lng: marker.position.lng()}
            });

            //draw the marker directlly (no need to read again all items from firebase)
            marker.set("id","New marker");
            $scope.markers.push(marker);
            $scope.$apply();
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

            polyline.set("id","New polyline");
            polyline.set("key","e444");

            $scope.polylines.push(polyline);
            $scope.$digest();

            var polyline_path = [];
            polyline.getPath().forEach(function(element) {
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

            if(type == 'marker'){
                for(var i = 0 ; i < $scope.markers.length ; i++){
                    if($scope.markers[i].get("id") == key){
                        //remove item from view
                        $scope.markers[i].setMap(null);
                        $scope.markers.splice(i, 1);
                        //remove item from firebase
                        firebase_drawing_markers.child(key).remove();
                        console.log('delete item from map, type: '+ type+' key: '+key+' done');
                    }
                }
            }
            if(type == 'circle'){
                for(var i = 0 ; i < $scope.circles.length ; i++){
                    if($scope.circles[i].get("id") == key){
                        //remove item from view
                        $scope.circles[i].setMap(null);
                        $scope.circles.splice(i, 1);
                        //remove item from firebase
                        firebase_drawing_circles.child(key).remove();
                        console.log('delete item from map, type: '+ type+' key: '+key+' done');
                    }
                }
            }
            if(type == 'polyline'){
                for(var i = 0 ; i < $scope.polylines.length ; i++){
                    if($scope.polylines[i].get("id") == key){
                        //remove from view
                        $scope.polylines[i].setMap(null);
                        $scope.polylines.splice(i, 1);
                        //remove from firebase
                        firebase_drawing_polyline.child(key).remove();
                        console.log('delete item from map, type: '+ type+' key: '+key+' done');
                    }
                }
            }
        }

        $scope.highLightItem = function (type, key) {
            if(type == 'marker'){
                for(var i = 0 ; i < $scope.markers.length ; i++){
                    if($scope.markers[i].get("id") == key){

                        console.log('highlight item in map, type: '+ type+' key: '+key+' done');
                    }
                }
            }
            if(type == 'circle'){
                for(var i = 0 ; i < $scope.circles.length ; i++){
                    if($scope.circles[i].get("id") == key){

                        console.log('highlight item in map, type: '+ type+' key: '+key+' done');
                    }
                }
            }
            if(type == 'polyline'){
                for(var i = 0 ; i < $scope.polylines.length ; i++){
                    if($scope.polylines[i].get("id") == key){
                        //change color
                        var current_color = $scope.polylines[i].get("strokeColor");
                        $scope.polylines[i].set("strokeColor","51fe0d");

                        //zoom on item
                        //get polyline path
                        var poly_path = $scope.polylines[i].getPath();

                        //get 1 point from path
                        var location = poly_path.pop();

                        $scope.map.setCenter(location);
                        console.log('highlight item in map, type: '+ type+' key: '+key+' done');
                    }
                }
            }
        }
        // ****************************** Drawing events end *******************************





    }

    // *************************** Trip tips on map **************************

    $scope.startMapTips = function () {

        //Map configuration
        $scope.map_tips = new google.maps.Map(document.getElementById('map_tips'), {
            //center: {lat: 34.397, lng: 40.644},
            center: {lat: 0, lng: 0},
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
        var input = document.getElementById('pac-input_tips');
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


        //Filter tips
        $scope.filterTipsOnClick = function (filterStr) {
            switch (filterStr) {
                case 'all':
                {
                    $scope.showAllTips = true;
                    $scope.showTips = false;
                    $scope.showRisks = false;
                    $scope.filterExpense = false;
                    $scope.showInvite = false;
                    break;
                }
                case 'tips':
                {
                    $scope.showAllTips = false;
                    $scope.showTips = true;
                    $scope.showRisks = false;
                    $scope.showExpense = false;
                    $scope.showInvite = false;
                    break;
                }
                case 'risks':
                {
                    $scope.showAllTips = false;
                    $scope.showTips = false;
                    $scope.showRisks = true;
                    $scope.showExpense = false;
                    $scope.showInvite = false;
                    break;
                }
                case 'expense':
                {
                    $scope.showAllTips = false;
                    $scope.showTips = false;
                    $scope.showRisks = false;
                    $scope.showExpense = true;
                    $scope.showInvite = false;
                    break;
                }
                case 'invite':
                {
                    $scope.showAllTips = false;
                    $scope.showTips = false;
                    $scope.showRisks = false;
                    $scope.showExpense = false;
                    $scope.showInvite = true;
                    break;
                }
            }
        }

        //Listener to click on map to get GPS
        $scope.map_tips.addListener('click', function (e) {
            $scope.message = {lat: e.latLng.lat(), lng: e.latLng.lng(), time: new Date()};
            //$scope.$apply(); I don't know what will be the behave after disable this
        });

        //**********************  load Tips from Firebase ******************
        //******************************************************************
        //******************************************************************
        var firebase_ref_readTips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/messages');

        firebase_ref_readTips.on("value", function (snapshot) {
            $scope.messages = [];

            snapshot.forEach(function (childSnapshot) {
                //var key = childSnapshot.key();
                var childData = childSnapshot.val(); // childData = location and message and time
                //$scope.messages.unshift(childData['message']);
                $scope.messages.unshift(childData);
            });
            //$scope.$apply();
        }, function (errorObject) {
            console.log("Read Tips from Firebase failed: " + errorObject.code);
        });

        //Add new tip
        $scope.addMessage = function () {
            // add a new note to firebase
            var message_json = {};

            var firebase_tips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.trip.id + '/messages');

            //var usersRef = firebase_ref.child('history');

            var location = {coords: {latitude: $scope.message.lat, longitude: $scope.message.lng}};
            message_json = {
                location: location,
                time: $scope.message.time,
                email: '',
                message: {tip: $scope.message.text, invite: '', risk: '', price: ''}
            };

            firebase_tips.push(message_json);
        }
    }

    // ************************** Start expense view *********************************
    $scope.startExpense = function () {

        //trip days
        var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
        var firstDate = new Date($scope.trip.dateStart);
        var secondDate = new Date($scope.trip.dateEnd);

        $scope.tripDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));


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




        $scope.getNumber = function(num) {
            return new Array(num);
        }


    }

});
