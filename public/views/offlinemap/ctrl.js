trackerApp.controller('offlinemapCtrl', function ($scope, $timeout, $firebaseObject, $firebaseArray, $http, $document, dataBaseService, messages, localStorageService) {


//NOTES:
//**** Should I move all AWS S3 to server? it is risky to be in the client?
//****
//****
//****
//****
        $scope.user = messages.getUser(); //replace with local service like next line
        $scope.email = localStorageService.get('email');
        $scope.tripID = messages.getTripID();
        $scope.travelersList = [];
        $scope.data = []; // Travellers from PG DB
        $scope.tips = []; // Tips from Firebase, based on GPS point


        var email_no_shtrodel = $scope.email.replace('@', 'u0040');
        var email_no_shtrodel_dot = email_no_shtrodel.replace('.', 'u002E');


        // Get a Firebase database reference to our posts
        var firebase_ref = new Firebase("https://luminous-torch-9364.firebaseio.com/" + email_no_shtrodel_dot + '/' + $scope.tripID);


        if ($scope.email == '' || $scope.tripID == '')
            alert('no email or trip id')
//AWS Config
        AWS.config.credentials = new AWS.Credentials('AKIAIGEOPTU4KRW6GK6Q', 'VERZVs+/nd56Z+/Qxy1mzEqqBwUS1l9D4YbqmPoO');

        // Configure your region
        AWS.config.region = 'us-west-2';

        // below AWS S3 code used to get photos and show in offline page
        var S3URL = 'https://s3-us-west-2.amazonaws.com/';
        $scope.photos = [];

        var bucket = new AWS.S3({params: {Bucket: 'tracker.photos', Marker: $scope.email + '/' + $scope.tripID}});

        bucket.listObjects(function (err, data) {
            if (err) {
                document.getElementById('status').innerHTML =
                    'Could not load objects from S3';
            } else {
                document.getElementById('status').innerHTML =
                    'Loaded ' + data.Contents.length + ' items from S3';
                for (var i = 0; i < data.Contents.length; i++) {
                    var photo_extenstion = data.Contents[i].Key.split('.').pop();

                    if (photo_extenstion == "gif" || photo_extenstion == "png" || photo_extenstion == "bmp" || photo_extenstion == "jpeg" || photo_extenstion == "jpg"
                        || photo_extenstion == "GIF" || photo_extenstion == "PNG" || photo_extenstion == "BMP" || photo_extenstion == "GPEG" || photo_extenstion == "JPG") {

                        $scope.photos.push(S3URL + 'tracker.photos/' + data.Contents[i].Key);
                    }
                    $scope.$apply();
                }
            }
        });

        //upload file to AWS S3
        var bucket_upload = new AWS.S3({params: {Bucket: 'tracker.photos'}});// should I use a new bucket variable?

        var fileChooser = document.getElementById('file-chooser');
        var button = document.getElementById('upload-button');
        var results = document.getElementById('results');
        button.addEventListener('click', function () {
            var file = fileChooser.files[0];

            //if it's a KML file then override the exists one, save it in the same name
            var file_extenstion = file.name.split('.').pop();
            if (file_extenstion == 'kml' || file_extenstion == 'KML') {

                if (file) {
                    results.innerHTML = '';

                    var params = {
                        Key: $scope.email + '/' + $scope.tripID + '/' + 'map_kml.kml',
                        ContentType: file.type,
                        Body: file
                    };
                    bucket_upload.upload(params, function (err, data) {
                        results.innerHTML = err ? 'ERROR!' : 'UPLOADED.';
                    });
                } else {
                    results.innerHTML = 'Nothing to upload.';
                }
            }
            if (file_extenstion == "gif" || file_extenstion == "png" || file_extenstion == "bmp" || file_extenstion == "jpeg" || file_extenstion == "jpg"
                || file_extenstion == "GIF" || file_extenstion == "PNG" || file_extenstion == "BMP" || file_extenstion == "GPEG" || file_extenstion == "JPG") {

                if (file) {
                    results.innerHTML = '';
                    var params = {
                        Key: $scope.email + '/' + $scope.tripID + '/' + file.name,
                        ContentType: file.type,
                        Body: file
                    };
                    bucket_upload.upload(params, function (err, data) {
                        results.innerHTML = err ? 'ERROR!' : 'UPLOADED.';
                    });
                } else {
                    results.innerHTML = 'Nothing to upload.';
                }
            }
        }, false);


        var users_hash = {};
        var polys = []; // will hold poly for each user


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

        $scope.map.addListener('click', function (e) {
            $scope.message = {lat: e.latLng.lat(), lng: e.latLng.lng()};
            $scope.$apply();
        });

        var ctaLayer = new google.maps.KmlLayer({
            url: 'https://s3-us-west-2.amazonaws.com/tracker.photos/' + $scope.email + '/' + $scope.tripID + '/map_kml.kml',
            map: $scope.map
        });

        $scope.addMessage = function () {


            // add a new note


            var message_json = {};

            var usersRef = firebase_ref.child('history');

            message_json = {
                "message": {
                    "text": $scope.message.text,
                    "latitude": $scope.message.lat,
                    "longitude": $scope.message.lng,
                    "timestamp": $scope.message.time
                }
            }
            usersRef.push(message_json);
        }


        //Help functions
        //this function used for get the unicode (testing)
        function toUnicode(theString) {
            var unicodeString = '';
            for (var i = 0; i < theString.length; i++) {
                var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
                while (theUnicode.length < 4) {
                    theUnicode = '0' + theUnicode;
                }
                theUnicode = '\\u' + theUnicode;
                unicodeString += theUnicode;
            }
            return unicodeString;
        }


        /// Map configuration END


        // socket to update client directly for new GPS / tips


        /*
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
         currentPath.push(new google.maps.LatLng(JSON.parse(data.latitude), JSON.parse(data.longitude)));

         console.log(trackCoordinates);
         //each new gps point means that the user is Active
         var userStatus = document.getElementById(data.email);
         userStatus.style.background = "url('../../assets/images/online.png') left center/30px 30px no-repeat";
         //update map
         //  trackPath.setMap($scope.map);
         }
         });
         */

        //
        //   1. no need to load all users
        //   2. no need for hash table
        //   3. no need to view all users in the html
        //   4. all what is need it just to load the GPS points for the user

        /*
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
         if (childData.email = $scope.email) {
         console.log(childData);
         users_hash[childData.email].push(childData);
         }

         }
         });
         */
        //build path for each user
        //loop hashtable

        /*
         var color_index = -1;
         for (key_name in users_hash) {
         console.log(key_name); // the key_name = email, the HashTable mapped email -> Points from FireBase


         var path = []; // new path for each user in hashtable
         var colors = ['#0000FF', '#D2691E', '#FF0000', '#DAA520']

         if (colors.length > color_index) // point index for next color only when the index is less than the length (else we will stuck with the same color :) )
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
         polys[key_name] = new google.maps.Polyline({
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

         */

        /*
         //load tips from 1 user (messages from Firebase)
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
         if (childData.email == $scope.email) { // show tips only from 1 user
         if (childData.message != "") { //if message is empty then no need to add and show
         $scope.tips.unshift(childData);
         $scope.$apply(); //when we use non angular like JQuery then I need to use this function to update view after pushing data to array scope
         }
         }
         }
         });
         });
         */

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



