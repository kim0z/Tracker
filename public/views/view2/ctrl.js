trackerApp.controller('view2Ctrl', function ($scope, $firebaseObject, $http, $document, dataBaseService, messages) {

        $scope.user = messages.getUser();
        $scope.travelersList = [];
        $scope.data = []; // Travellers from PG DB
        $scope.tips = []; // Tips from Firebase, based on GPS point

        // Get a database reference to our posts
        var ref = new Firebase("https://luminous-torch-9364.firebaseio.com/");

        //$scope.init = function () {
        var trackCoordinates = [];
        $scope.map;
        $scope.lastGPSpoint = "";

        $scope.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 34.397, lng: 40.644},
            zoom: 5
        });

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


                $scope.tips.unshift(data);
                $scope.$apply(); //when we use non angular like JQuery then I need to use this function to update view after pushing data to array scope


                //zoom to the new GPS point

                //gMap = new google.maps.Map(document.getElementById('map'));
                $scope.map.setZoom(11);      // This will trigger a zoom_changed on the map
                $scope.map.setCenter(new google.maps.LatLng(data.latitude, data.longitude));
                //gMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);


                //add the GPS point to trqckPath to draw the line in map
                trackCoordinates.push({lat: JSON.parse(data.latitude), lng: JSON.parse(data.longitude)});

                var trackPath = new google.maps.Polyline({
                    path: trackCoordinates,
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 2
                });
                console.log(trackCoordinates);
                //each new gps point means that the user is Active
                var userStatus = document.getElementById(data.email);
                userStatus.style.background = "url('../../assets/images/online.png') left center/30px 30px no-repeat";
                //update map
                trackPath.setMap($scope.map);
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
                }
            }
            loadUsers();
        })

        //load tips (messages from Firebase)
        // Attach an asynchronous callback to read the data at our posts reference
        ref.once("value", function(snapshot) {
            // The callback function will get called twice, once for "fred" and once for "barney"
            snapshot.forEach(function(childSnapshot) {
                // key will be "fred" the first time and "barney" the second time
                var key = childSnapshot.key();
                // childData will be the actual contents of the child
                var childData = childSnapshot.val();

                if(!childData.hasOwnProperty('active')) { //if Object include active then it means it's not a GPS point with message
                   // console.log(childData);
                    $scope.tips.unshift(childData);
                    $scope.$apply(); //when we use non angular like JQuery then I need to use this function to update view after pushing data to array scope
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



