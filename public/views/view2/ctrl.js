trackerApp.controller('view2Ctrl', function ($scope, $firebaseObject, $http, $document, dataBaseService, messages, $timeout, localStorageService) {




        $scope.user = messages.getUser();
        $scope.travelersList = [];
        $scope.data = []; // Travellers from PG DB
        $scope.tips = []; // Tips from Firebase, based on GPS point
        var users_hash = {};
        var polys = []; // will hold poly for each user
        $scope.messages = [];

        // Get a database reference to our posts
        var ref = new Firebase("https://luminous-torch-9364.firebaseio.com/mobile/users");

        //$scope.init = function () {
        var trackCoordinates = []; // for new GPS points

        $scope.map;
        $scope.lastGPSpoint = "";


        //Map configuration
        $scope.map = new google.maps.Map(document.getElementById('map'), {
            //center: {lat: 34.397, lng: 40.644},
            center: {lat: 0, lng: 0},
            zoom: 3,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        });


        /// Map configuration END


        // socket to update client directly for new GPS / tips

        var socket = io.connect('http://localhost:8080');
        socket.on('GpsPoint', function (data) {
            //console.log(data);
            console.log('GPS new point: ' + data);


            //check if JSON is sign from a user about start GPS / or adding a new GPS point
            var userStatus = document.getElementById(data.email);

            if (data.hasOwnProperty('active')) {
                if (data.active == 'true') {
                    userStatus.style.background = "url('../../assets/images/online.png') left center/30px 30px no-repeat";
                } else {
                    userStatus.style.background = "url('../../assets/images/offline.png') left center/20px 20px no-repeat";
                }
            } else {

                if (data.message != "") { //if message is empty then no need to add and show
                    $scope.tips.unshift(data);
                    $scope.$apply(); //when we use non angular like JQuery then I need to use this function to update view after pushing data to array scope
                }

                //zoom to the new GPS point

                //gMap = new google.maps.Map(document.getElementById('map'));
                $scope.map.setZoom(13);      // This will trigger a zoom_changed on the map
                $scope.map.setCenter(new google.maps.LatLng(data.latitude, data.longitude));
                //$scope.map.center =  {lat: data.latitude, lng: data.longitude};
                //gMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);


                // get polyline from map (reminder: each polyline name by email)
                var currentPath = polys[data.email].getPath();
                currentPath.push(new google.maps.LatLng(JSON.parse(data.latitude), JSON.parse(data.longitude)));

                //console.log(trackCoordinates);
                //each new gps point means that the user is Active
                var userStatus = document.getElementById(data.email);
                userStatus.style.background = "url('../../assets/images/online.png') left center/30px 30px no-repeat";
                //update map
                //  trackPath.setMap($scope.map);
            }
        });


        //read active users Firebase -> mobile -> users
        //Read already saved paths
        //read already saved messages

        var firstPathLoad_firebase = ref.once("value", function (snapshot) {
            loadUsers = function () {
                var id = 0;
                snapshot.forEach(function (childSnapshot) {
                    console.log(childSnapshot.val());


                    var user = childSnapshot.val();
                    // key will be "fred" the first time and "barney" the second time
                    var key = childSnapshot.key();


                    // no need meanwhile, I am using user id instead of email in Firebase
                    //var email_with_shtrodel = key.replace('u0040', '@');
                    //var email_with_shtrodel_dot = email_with_shtrodel.replace('u002E', '.');

                    // console.log(email_with_shtrodel_dot);


                    $scope.data.push({
                        id: user.auth.userID,
                        name: user.auth.name,
                        email: user.auth.email
                    });


                    //**************
                    //handle paths
                    //*************
                    //path for each user

                    // instead of 211 I should add the active trip path, flag
                    var childPath = childSnapshot.child('211/path');
                    var path = [];

                    childPath.forEach(function (childCoords) {

                        //console.log(childCoords.key());
                        //console.log(childCoords.key());

                        var coords = childCoords.val();

                        path.push({
                            lat: JSON.parse(coords['coords'].latitude),
                            lng: JSON.parse(coords['coords'].longitude)
                        });
                        //users_hash[email_with_shtrodel_dot] = path;
                    })

                    //dashed line
                    var lineSymbol = {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 1,
                        scale: 4
                    };

                    //Hash table for all users path
                    polys[key] = new google.maps.Polyline({
                        path: path,
                        geodesic: true,
                        strokeColor: getRandomColor(),
                        strokeOpacity: 0,
                        strokeWeight: 2,
                        icons: [{
                            icon: lineSymbol,
                            offset: '0',
                            repeat: '20px'
                        }]
                    });

                    polys[key].setMap($scope.map);

                    /*
                     //***************
                     //handle messages
                     //***************
                     //path for each user
                     var childPath_messages = childSnapshot.child('messages');
                     var allMessageOfUser = [];

                     childPath_messages.forEach(function (childCoords) {
                     allMessageOfUser.push(childCoords.val());
                     })
                     //all messages saved in below hashtable, key = email
                     $scope.messages[email_with_shtrodel_dot] = allMessageOfUser;
                     */
                });

            }
            loadUsers();
            $scope.$apply();

        });

        //not sure this wait needed, test it and then remove it, remove in case the above function works once
        $timeout(function () {
            ref.off('value', firstPathLoad_firebase);
            console.log('timeout');
        }, 5000);


        //keep listening for new path updates, first let's add listeners for all users under "path"
        //keep listening for new messages updates, first let's add listeners for all users under "messages"
        //What if new user just added
        ref.on("value", function (users) {
            $timeout(function () {
                users.forEach(function (childSnapshot) {
                    // childSnapshot == mobile/users/id

                    // childSnapshot == mobile/users/email

                    var data = childSnapshot.val();

                    childSnapshot.forEach(function (path) {
                        if (path.key() == 'path') {

                            //create reference for each path
                            var pathRef = path.ref();

                            pathRef.limitToLast(1).on('child_added', function (childSnapshot, prevChildKey) {

                                //childSnapshot == new point added

                                //get parent of path to know the email, and then add the new point to the exists path
                                var parent = pathRef.parent();
                                //var email = parent.key();

                                var id = parent.key();

                                console.dir(email);

                                //var email_with_shtrodel = email.replace('u0040', '@');
                                //var email_with_shtrodel_dot = email_with_shtrodel.replace('u002E', '.');

                                console.log(childSnapshot.val().coords.latitude + '  ' + childSnapshot.val().coords.longitude);

                                // get existing path
                                var path = polys[id].getPath();

                                // add new point
                                path.push(new google.maps.LatLng(childSnapshot.val().coords.latitude, childSnapshot.val().coords.longitude));
                                // update the polyline with the updated path
                                //polys[parentData.email].setPath(path);

                                polys[id].setPath(path);

                                $scope.$apply();
                            })
                        }
                        if (path.key() == 'messages') {

                            //create reference for each message
                            var messageRef = path.ref();

                            messageRef.limitToLast(1).on('child_added', function (childSnapshot, prevChildKey) {

                                //get parent of path to know the email, and then add the new point to the exists path
                                var parent = messageRef.parent();
                                var email = parent.key();
                                console.dir(email);

                                var email_with_shtrodel = email.replace('u0040', '@');
                                var email_with_shtrodel_dot = email_with_shtrodel.replace('u002E', '.');

                                // $scope.messages[email_with_shtrodel_dot] = {};
                                // $scope.messages[email_with_shtrodel_dot].push(childSnapshot.val());

                                console.dir('new message added : ' + childSnapshot.val());
                                $scope.messages.push(childSnapshot.val());

                                $scope.$apply();
                            })
                        }
                    })
                })
            }, 4000);
        })

        //load tips (messages from Firebase)
        // Attach an asynchronous callback to read the data at our posts reference
        ref.once("value", function (snapshot) {
            // The callback function will get called twice, once for "fred" and once for "barney"
            snapshot.forEach(function (childSnapshot) {
                // key will be "fred" the first time and "barney" the second time
                var key = childSnapshot.key();
                // childData will be the actual contents of the child
                var childData = childSnapshot.val();

                if (!childData.hasOwnProperty('active')) { //if Object include active then it means it's not a GPS point with message
                    // console.log(childData);
                    if (childData.message != "") { //if message is empty then no need ro add and show
                        $scope.tips.unshift(childData);
                        $scope.$apply(); //when we use non angular like JQuery then I need to use this function to update view after pushing data to array scope
                    }
                }
            });
        });


        //help function
        function getRandomColor() {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        $scope.zoomIntoPath = function ($event) {
            //console.log($event.currentTarget.id);

            zoomToObject(polys[$event.currentTarget.id]);
        }

        function zoomToObject(obj) {
            var bounds = new google.maps.LatLngBounds();
            var points = obj.getPath().getArray();
            for (var n = 0; n < points.length; n++) {
                bounds.extend(points[n]);
            }
            $scope.map.fitBounds(bounds);
        }

    })

    //zoom into path


    .directive('infiniteScroll', function () {
        return {
            restrict: 'A',
            scope: {
                ajaxCall: '&'
            },
            link: function (scope, elem, attrs) {
                box = elem[0];
                elem.bind('scroll', function () {
                    if ((box.scrollTop + box.offsetHeight) >= box.scrollHeight) {
                        scope.$apply(scope.ajaxCall)
                    }
                })
            }
        }
    })







