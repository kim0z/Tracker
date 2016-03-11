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

//////////////
    /// Maps overlay

/*
        var overlay;
        USGSOverlay.prototype = new google.maps.OverlayView();


        var bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(62.281819, -150.287132),
            new google.maps.LatLng(62.400471, -150.005608));


        // The photograph is courtesy of the U.S. Geological Survey.
        var srcImage = 'https://developers.google.com/maps/documentation/' +
            'javascript/examples/full/images/talkeetna.png';

        // The custom USGSOverlay object contains the USGS image,
        // the bounds of the image, and a reference to the map.
        overlay = new USGSOverlay(bounds, srcImage, map);


        /!** @constructor *!/
        function USGSOverlay(bounds, image, map) {

            // Initialize all properties.
            this.bounds_ = bounds;
            this.image_ = image;
            this.map_ = map;

            // Define a property to hold the image's div. We'll
            // actually create this div upon receipt of the onAdd()
            // method so we'll leave it null for now.
            this.div_ = null;

            // Explicitly call setMap on this overlay.
            this.setMap($scope.map);
        }



        /!**
         * onAdd is called when the map's panes are ready and the overlay has been
         * added to the map.
         *!/
        USGSOverlay.prototype.onAdd = function() {

            var div = document.createElement('div');
            div.style.borderStyle = 'none';
            div.style.borderWidth = '0px';
            div.style.position = 'absolute';

            // Create the img element and attach it to the div.
            var img = document.createElement('img');
            img.src = this.image_;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.position = 'absolute';
            div.appendChild(img);

            this.div_ = div;

            // Add the element to the "overlayLayer" pane.
            var panes = this.getPanes();
            panes.overlayLayer.appendChild(div);
        };

        USGSOverlay.prototype.draw = function() {

            // We use the south-west and north-east
            // coordinates of the overlay to peg it to the correct position and size.
            // To do this, we need to retrieve the projection from the overlay.
            var overlayProjection = this.getProjection();

            // Retrieve the south-west and north-east coordinates of this overlay
            // in LatLngs and convert them to pixel coordinates.
            // We'll use these coordinates to resize the div.
            var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
            var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

            // Resize the image's div to fit the indicated dimensions.
            var div = this.div_;
            div.style.left = sw.x + 'px';
            div.style.top = ne.y + 'px';
            div.style.width = (ne.x - sw.x) + 'px';
            div.style.height = (sw.y - ne.y) + 'px';
        };


*/



////////// Done















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

                if(data.message != "") { //if message is empty then no need to add and show
                    $scope.tips.unshift(data);
                    $scope.$apply(); //when we use non angular like JQuery then I need to use this function to update view after pushing data to array scope
                }

                //zoom to the new GPS point

                //gMap = new google.maps.Map(document.getElementById('map'));
                $scope.map.setZoom(11);      // This will trigger a zoom_changed on the map
                $scope.map.setCenter(new google.maps.LatLng(data.latitude, data.longitude));
                //gMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);


                //add the GPS point to trqckPath to draw the line in map
                trackCoordinates.push({lat: JSON.parse(data.latitude), lng: JSON.parse(data.longitude)});

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
                    if(childData.message != "") { //if message is empty then no need ro add and show
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



