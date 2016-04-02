trackerApp.controller('view2Ctrl', function ($scope, $firebaseObject, $http, $document, dataBaseService, messages) {

        $scope.user = messages.getUser();
        $scope.travelersList = [];
        $scope.data = []; // Travellers from PG DB
        $scope.tips = []; // Tips from Firebase, based on GPS point
        var users_hash = {};
        var polys = []; // will hold poly for each user

        // Get a database reference to our posts
        var ref = new Firebase("https://luminous-torch-9364.firebaseio.com/");

        //$scope.init = function () {
        var trackCoordinates = []; // for new GPS points

        $scope.map;
        $scope.lastGPSpoint = "";

        //Map configuration
        $scope.map = new google.maps.Map(document.getElementById('map'), {
            //center: {lat: 34.397, lng: 40.644},
            center: {lat: 0, lng: 0},
            zoom: 5,
            mapTypeId: google.maps.MapTypeId.TERRAIN
        });


        /// Map configuration END


        // socket to update client directly for new GPS / tips

        var socket = io.connect('http://localhost:8080');
        socket.on('GpsPoint', function (data) {
            console.log(data);
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
                currentPath.push(new google.maps.LatLng(JSON.parse(data.latitude),JSON.parse(data.longitude)));



                //add the GPS point to trqckPath to draw the line in map
              //  trackCoordinates.push({lat: JSON.parse(data.latitude), lng: JSON.parse(data.longitude)});


                /*
                // Define a symbol using SVG path notation, with an opacity of 1.
                //dashed line
                var lineSymbol = {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 4
                };

                var trackPath = new google.maps.Polyline({
                    path: trackCoordinates,
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 0,
                    strokeWeight: 2,
                    icons: [{
                        icon: lineSymbol,
                        offset: '0',
                        repeat: '20px'
                    }]
                });
*/



                console.log(trackCoordinates);
                //each new gps point means that the user is Active
                var userStatus = document.getElementById(data.email);
                userStatus.style.background = "url('../../assets/images/online.png') left center/30px 30px no-repeat";
                //update map
              //  trackPath.setMap($scope.map);
            }
        });


        //get users names to push it into the list of active travelers
        dataBaseService.getUsersList().then(function (results) {
            loadUsers = function () {
                for (var i = 0; i < results.data.rows.length; i++) {
                    $scope.data.push({
                        id: i + 1,
                        name: results.data.rows[i].name,
                        email: results.data.rows[i].email
                    });
                    $scope.id++;

                    users_hash[results.data.rows[i].email] = []; // add users to hash table( it will be used to add all GPS points to the right user)
                }
            }
            loadUsers(); //load users to the list in the right side

            //get all GPS points from FireBase and push to the right user in the hashtable


            ref.once("value", function (snapshot) {
                // The callback function will get called twice, once for "fred" and once for "barney"
                snapshot.forEach(function (childSnapshot) {
                    // key will be "fred" the first time and "barney" the second time
                    var key = childSnapshot.key();
                    // childData will be the actual contents of the child
                    var childData = childSnapshot.val();

                    if (!childData.hasOwnProperty('active')) { //if Object include active then it means it's not a GPS point with message
                        console.log(childData);
                         users_hash[childData.email].push(childData);
                    }
                });

                //build path for each user
                //loop hashtable
                var color_index = -1;
                for (key_name in users_hash) {
                    console.log(key_name); // the key_name = email, the HashTable mapped email -> Points from FireBase


                    var path = []; // new path for each user in hashtable
                    var colors = ['#0000FF', '#D2691E', '#FF0000', '#DAA520']

                    if(colors.length > color_index) // point index for next color only when the index is less than the length (else we will stuck with the same color :) )
                        color_index++;


                    for (var i = 0; i < users_hash[key_name].length; i++) {

                        path.push({
                            lat: JSON.parse(users_hash[key_name][i].latitude),
                            lng: JSON.parse(users_hash[key_name][i].longitude)
                        });
                    }

                    //dashed line
                    var lineSymbol = {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 1,
                        scale: 4
                    };



                  //  var trackPath_users
                    polys[key_name]  = new google.maps.Polyline({
                        path: path,
                        geodesic: true,
                        strokeColor: colors[color_index],
                        strokeOpacity: 0,
                        strokeWeight: 2,
                        icons: [{
                            icon: lineSymbol,
                            offset: '0',
                            repeat: '20px'
                        }]
                    });

                    polys[key_name].setMap($scope.map);

                }

                // var childData.email
                //    .push({lat: JSON.parse(data.latitude), lng: JSON.parse(data.longitude)});


            });


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


    })


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



