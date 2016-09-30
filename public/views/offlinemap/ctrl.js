trackerApp.controller('offlinemapCtrl', function ($rootScope, $scope, $timeout, $firebaseObject, $firebaseArray, $http, $document, dataBaseService, messages, localStorageService, Facebook, $resource) {


    $scope.profile = localStorageService.get('profile');
    $scope.userAccessToken = localStorageService.get('providerToken');

    if (!$scope.profile) {
        console.log('offline:: auth :: no data about the user, profile is emppty');
    }

    //var facebookIdNotClean = $scope.profile.user_id; //"facebook|"
    //var facebookId = facebookIdNotClean.replace(/^\D+/g, '');

    var facebookId = $scope.profile.identities[0].user_id;

//NOTES:
//**** Should I move all AWS S3 to server? it is risky to be in the client?
//****
//****
//****
//****

    $scope.columns = [
        {title: 'Name', field: 'name', visible: true, filter: {'name': 'text'}},
        {title: 'Age', field: 'age', visible: true},
        {title: 'country', field: 'add', visible: true, subfield: 'coun'}
    ];


    $rootScope.Utils = {
        keys: Object.keys
    }

    $scope.openNav = function () {
        document.getElementById("mySidenav").style.width = "420px";
    }

    $scope.closeNav = function () {
        document.getElementById("mySidenav").style.width = "0";
    }


    $scope.user = messages.getUser(); //replace with local service like next line

    //Bug
    //get the mail from storage is not the best way, because after refresh it is deleted, I should change way how to get mail - bug opened in Driver
    //$scope.email = localStorageService.get('email');


    var email_no_shtrodel = $scope.profile.email.replace('@', 'u0040');
    var email_no_shtrodel_dot = email_no_shtrodel.replace('.', 'u002E');


    $scope.tripID = messages.getTripID();
    $scope.travelersList = [];
    $scope.data = []; // Travellers from PG DB
    $scope.messages = []; // Tips from Firebase, based on GPS point
    var markers_messages = [];
    $scope.editMode = false;
    $scope.panoViewState = false;
    $scope.editButtonText = 'Edit Mode';
    var showMessageOnMap_clicked = false;

    $scope.photosSlider = true;
    $scope.tableSlider = true;


    $scope.facebookAlbums = {}; //when page loaded, a Facebook API triggered to get user albums in case new album was added
                                //to show it in edit mode to allow users select the new albums

    $scope.facebookAlbumsFriebase = {}; //sync albums from Firebase config to know what photos to load
    $scope.facebookPhotos = []; //the same photos array used when load the page and when sync the new albums

    //Table
    $scope.table = [];

    //Photo slider
    $scope.prod = {};
    $scope.prod.imagePaths = [];
    $scope.facebookImagesReady = false;

    /* don't now what the below for, disable until error
     $scope.value = undefined;
     */
    //items array used for facebook photos
     $scope.items = [];

    $scope.selectedFacebookAlbum = [];
    $scope.facebookAlbumsList = []; //Facebook albums from Firebase


    //read albums from Firebase config and then load photos
    //read albums from Firebase for:
    // 1. update edit mode list witht the enabled albums (not to update the list witht the albums list, only if it enabled, reason: could be that the list in facebook more updated)
    // 2. show the photos in Gallery of the enabled photos

    //var firebase_config_get_albums = new Firebase("https://trackerconfig.firebaseio.com/web/" + email_no_shtrodel_dot + "/offline/photos/facebook/trip/" + $scope.tripID);

    var firebase_config_get_albums = new Firebase("https://trackerconfig.firebaseio.com/web/" + facebookId + "/offline/photos/facebook/trip/" + $scope.tripID);
    

    firebase_config_get_albums.on("value", function (snapshot) {
        //  var i = 0;
        snapshot.forEach(function (childsnapshot) {
            $scope.facebookAlbumsFriebase[childsnapshot.key()] = {
                checkbox: childsnapshot.val()['checkbox'],
                albumID: childsnapshot.val()['albumID'],
                albumName: childsnapshot.val()['albumName']
            };

            //add the albums list from Firebase to the list in edit mode
            $scope.facebookAlbumsList[childsnapshot.key()] = {
                id: childsnapshot.key(),
                label: childsnapshot.val()['albumName'],
                albumID: childsnapshot.val()['albumID']
            };

            //check if album saved in Firebase is enabled, checked = true
            //if Yes then add the id to the selected list of the List in edit mode
            //the list will be checked according to the enabled albums
            if (childsnapshot.val()['checkbox'] == true) {
                $scope.selectedFacebookAlbum[childsnapshot.key()] = {id: childsnapshot.key()};
            }
        })

        //load photos from all selected albums
        $scope.facebookPhotos = [];
        var albumLen = Object.keys($scope.facebookAlbumsFriebase).length;
        for (var i = 0; i < albumLen; i++) {
            if ($scope.facebookAlbumsFriebase[i].checkbox) {
                Facebook.api(
                    "/" + $scope.facebookAlbumsFriebase[i].albumID + "/photos?access_token="+$scope.userAccessToken,
                    function (album) {
                        if (album && !album.error) {
                            console.log('photos');
                            for (var photoIndex = 0; photoIndex < album.data.length; photoIndex++) {
                                Facebook.api(
                                    "/" + album.data[photoIndex].id + "/picture?access_token="+$scope.userAccessToken,
                                    function (photo) {
                                        if (photo && !photo.error) {
                                            /* handle the result */
                                            console.log(photo.data.url);
                                            $scope.facebookPhotos.push(photo.data.url);
                                            $scope.prod.imagePaths.push({
                                                custom: photo.data.url,
                                                thumbnail: photo.data.url
                                            });
                                            $scope.items.push({id: i, name: 'item' + i, img: photo.data.url});
                                        }
                                    });
                                if (photoIndex == album.data.length - 1) {
                                    $scope.facebookImagesReady = true;
                                    console.log('ready');
                                    $scope.$apply();
                                }
                            }
                        }
                    });
            }
        }
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });


/* for testing

        Facebook.api(
            "/"+facebookId+"/permissions?access_token="+$scope.userAccessToken,
            function (response) {
                if (response && !response.error) {

                }
            }
        );
*/

    //get all facebook user albums
    //read albums from Facebook for:
    // 1. update edit mode list witht he enabled albums

    Facebook.api(
        "/" + facebookId + "/albums?access_token="+$scope.userAccessToken,
        function (response) {
            if (response && !response.error) {
                /* handle the result */
                // console.log(response);
                for (var i = 0; i < response.data.length; i++) {
                    $scope.facebookAlbums[i] = {
                        checkbox: false,
                        albumID: response.data[i].id,
                        albumName: response.data[i].name
                    };
                    //$scope.facebookAlbumsList[i] = ({albumID: response.data[i].id, albumName: response.data[i].name, checkbox: false});
                }
            }
            $scope.$apply();
        }
    );

    // MultiSelect Drop down select - Event - Facebook albums
    $scope.selectAlbumEvents = {
        onItemSelect: function (property) {
            console.log('select > ' + property);
            console.log(property);
            //update albums array that will be saved in Firebase
            $scope.facebookAlbums[property.id] = {
                checkbox: true,
                albumID: property[property.id].albumID,
                albumName: response[property.id].albumName
            }
            console.log($scope.facebookAlbums);
        },

        onItemDeselect: function (property) {
            console.log('deselect : ' + property);
            $scope.facebookAlbums[property.id] = {
                checkbox: false,
                albumID: property[property.id].albumID,
                albumName: response[property.id].albumName
            }
            console.log($scope.facebookAlbums);
        },
        onSelectAll: function (property) {
            console.log('select all : ' + property);
            //create a new array from scratch with checkbox = true
            for (var index = 0; index < property.length; index++) {
                $scope.facebookAlbums[index] = {
                    checkbox: true,
                    albumID: property[index].albumID,
                    albumName: response[index].albumName
                }
            }
            console.log($scope.facebookAlbums);
        },
        onDeselectAll: function (property) {
            console.log('deselect all : ' + property);
            //create a new array from scratch with checkbox = false
            for (var index = 0; index < property.length; index++) {
                $scope.facebookAlbums[index] = {
                    checkbox: false,
                    albumID: property[index].albumID,
                    albumName: response[index].albumName
                }
            }
            console.log($scope.facebookAlbums);
        }
    }


    // Get a Firebase database reference to our posts
    var firebase_ref = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + facebookId + '/' + $scope.tripID);


    if ($scope.profile.email == '' || $scope.tripID == '')
        alert('no email or trip id')
    //AWS Config
    AWS.config.credentials = new AWS.Credentials('AKIAIGEOPTU4KRW6GK6Q', 'VERZVs+/nd56Z+/Qxy1mzEqqBwUS1l9D4YbqmPoO');

    // Configure your region
    AWS.config.region = 'us-west-2';

    // below AWS S3 code used to get photos and show in offline page
    var S3URL = 'https://s3-us-west-2.amazonaws.com/';
    $scope.photos = [];


    Facebook.getLoginStatus(function (response) {
        if (response.status == 'connected') {
            console.log('user is connected')
        }
    });

    //var facebookToken = localStorageService.get('facebookAuth').authResponse.accessToken;


    //Sync Facebook albums
    $scope.syncAlbums = function () {
        //save in Firebase config
        var firebase_config_albums = new Firebase("https://trackerconfig.firebaseio.com/web/" + facebookId + "/offline/photos/facebook/trip/" + $scope.tripID);
        firebase_config_albums.set($scope.facebookAlbums);

        $scope.facebookPhotos = [];
        var coverSelected = false;
        console.log($scope.facebookAlbums);
        var albumLen = Object.keys($scope.facebookAlbums).length;
        for (var i = 0; i < albumLen; i++) {
            if ($scope.facebookAlbums[i].checkbox) {

                if (!coverSelected) {
                    //get album cover photo and save in Firebase config to allow the trip cove be updated
                    //save cover photo only from the first album
                    Facebook.api(
                        "/" + $scope.facebookAlbums[i].albumID + "/picture",
                        function (cover) {
                            if (cover && !cover.error) {
                                console.log("https://trackerconfig.firebaseio.com/web/" + facebookId + "/tripslist/coverphoto/trip/" + $scope.tripID);
                                //save Facebook album cover in Firebase
                                var firebase_config_coverPhoto = new Firebase("https://trackerconfig.firebaseio.com/web/" + facebookId + "/tripslist/coverphoto/trip/" + $scope.tripID);
                                firebase_config_coverPhoto.set(cover.data.url);
                            }
                        });
                    coverSelected = true;
                }

                //load photos from all selected albums
                Facebook.api(
                    "/" + $scope.facebookAlbums[i].albumID + "/photos",
                    function (album) {
                        if (album && !album.error) {
                            console.log('photos');
                            for (var photoIndex = 0; photoIndex < album.data.length; photoIndex++) {
                                Facebook.api(
                                    "/" + album.data[photoIndex].id + "/picture",
                                    function (photo) {
                                        if (photo && !photo.error) {
                                            console.log(photo.data.url);
                                            $scope.facebookPhotos.push(photo.data.url);
                                            console.log($scope.facebookAlbums);
                                        }
                                    });
                            }
                        }
                    });
            }
        }
    }

    //var bucket = new AWS.S3({params: {Bucket: 'tracker.photos', Marker: $scope.email + '/' + $scope.tripID}});

    var bucket = new AWS.S3({
        params: {
            Bucket: 'tracker.photos',
            //Marker: localStorageService.get('email') + '/' + chunk.id
            Delimiter: '/',
            Prefix: $scope.profile.email + '/' + $scope.tripID + '/'
        }
    });

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
                    Key: $scope.profile.email + '/' + $scope.tripID + '/' + 'map_kml.kml',
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
                    Key: $scope.profile.email + '/' + $scope.tripID + '/' + file.name,
                    ContentType: file.type,
                    Body: file
                };
                bucket_upload.upload(params, function (err, data) {
                    results.innerHTML = err ? 'ERROR!' : 'UPLOADED.';
                });
            } else {
                results.innerHTML = 'Nothing to upload.';
            }
        } else {
            alert('file not supported')
        }
    }, false);


    var users_hash = {};
    var polys = []; // will hold poly for each user


    //$scope.init = function () {
    var trackCoordinates = []; // for new GPS points


    //************************* Map settings ****************************
    //*******************************************************************

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
        url: 'https://s3-us-west-2.amazonaws.com/tracker.photos/' + $scope.profile.email + '/' + $scope.tripID + '/map_kml.kml',
        map: $scope.map
    });


    $scope.showMessageOnMap = function (location) {
        if ($scope.editMode == false) {
            //#646c73
            if (showMessageOnMap_clicked == false) {
                showMessageOnMap_clicked = true;
                var Latlng_message = {lat: location.coords.latitude, lng: location.coords.longitude};

                //Help function - show item on map
                showItemOnMap(Latlng_message);

            } else {
                showMessageOnMap_clicked = false;
                //if clicked again, the marker should deleted and back the zoom to normal
                $scope.map.setZoom(5);
            }
        }
    }


    $scope.showPhotoOnMap = function (image) {
        //console.log(image.currentTarget.childNodes[1]);
        var img = image.currentTarget.childNodes[1];  //the second element is IMG, should add validation
        if ($scope.editMode == true) {
            //if Edit mode enabled then ask the user to set the GPS lat lng for the photos
            addGPStoPhoto(img);
        } else if ($scope.editMode == false) {
            if (img) {
                EXIF.getData(img, function () {
                    var make = EXIF.getTag(img, "Make"),
                        model = EXIF.getTag(img, "Model");
                    GPS_lat = EXIF.getTag(img, "GPSLatitude");
                    GPS_lng = EXIF.getTag(img, "GPSLongitude");

                    // alert("I was taken by a " + make + " " + model);
                    // alert("GPSLongitude " + GPS);

                    var toDecimal = function (number) {
                        return number[0].numerator + number[1].numerator /
                            (60 * number[1].denominator) + number[2].numerator / (3600 * number[2].denominator);
                    };

                    if (GPS_lat && GPS_lng) {

                        //console.log("lat: " + toDecimal(GPS_lat) + "  lng: " + toDecimal(GPS_lng));
                        // alert("toDecimal " + toDecimal(GPS[1])  );

                        var photo_lat_lng = {lat: toDecimal(GPS_lat), lng: toDecimal(GPS_lng)};

                        //Help function - show item on map
                        showItemOnMap(photo_lat_lng, null);

                    } else {
                        console.log('No GPS point embed to photo ' + img);
                        console.log('Check if image have GPS point that was added by user and saved to AWS S3 with the photo');
                        var file_path = img.currentSrc;

                        var filename = file_path.replace(/^.*[\\\/]/, '');
                        var file_noExtenstion = filename.replace(/\.[^/.]+$/, "");


                        // var bucket_getGPS_forPhoto = new AWS.S3({params: {Bucket: 'tracker.photos', Marker: $scope.email + '/' + $scope.tripID + '/' + file_noExtenstion +'.txt'}});


                        var fileGpsUrl = S3URL + 'tracker.photos/' + $scope.profile.email + '/' + $scope.tripID + '/' + file_noExtenstion + '.txt';
                        console.log(fileGpsUrl);

                        // get GPS point of the selected photo from AWS S3
                        $http({
                            method: 'GET',
                            url: fileGpsUrl
                        }).then(function successCb(response) {
                            console.dir(response);

                            showItemOnMap({lat: response.data.lat, lng: response.data.lng}, null);


                        }, function errorCb(response) {
                            console.log('No GPS point in AWS S3 for this photo');
                        });
                    }
                });
            }
        }
    }

    var showItemOnMap = function (Latlng) {

        //var myLatlng = {lat: message.latitude, lng: message.longitude};
        console.log('showItemOnMap function :: ' + 'lat:' + Latlng.lat + '     lng: ' + Latlng.lng);

        if ($scope.editMode == false) {
            if (Latlng.lat && Latlng.lng) {

                $scope.map.setCenter(Latlng);
                //smoothZoom($scope.map, 7, $scope.map.getZoom()); // call smoothZoom, parameters map, final zoomLevel

                //new google.maps.LatLng(-34, 151)

                var marker_message = new google.maps.Marker({
                    position: Latlng,
                    map: $scope.map,
                    title: 'null'
                });
                markers_messages.push(marker_message);

                var infowindow_message = new google.maps.InfoWindow({
                    content: 'null'
                });

                infowindow_message.open($scope.map, marker_message);

                var zoom_time = 3000;
                $scope.countdown = 100;
                setTimeout(function () {
                    smoothZoom($scope.map, 12, $scope.map.getZoom())
                }, 1000); // call smoothZoom, parameters map, final zoomLevel


                // angular.element(document.getElementById('messages')).append("<timer interval="+zoom_time+"  countdown= "+countdown +">"+{{countdown}}+"</timer>");


                //disable meanwhile, I changed the view, Google street map not exists any more, I should view streen in the same main map
                /*
                 var panorama = new google.maps.StreetViewPanorama(
                 document.getElementById('pano'), {
                 position: Latlng,
                 pov: {
                 heading: 34,
                 pitch: 10
                 }
                 });
                 $scope.map.setStreetView(panorama);
                 */
            }
        }
    }


    var addGPStoPhoto = function (img) {
        //get gps point from map and then

        //$scope.message
        $scope.image = {
            path: img.currentSrc
        }


    }

    $scope.saveGPStoThisPhoto = function () {
        //create a file and save it in AWS S3 with the same name of the photo with new extension name

        //create file

        var bucket_create_photo_gps = new AWS.S3({params: {Bucket: 'tracker.photos'}});

        var gps_point = {lat: $scope.message.lat, lng: $scope.message.lng};
        var button = document.getElementById('addGPStoPhoto');
        var results = document.getElementById('results_photo_gps');
        // button.addEventListener('click', function() {
        //    results.innerHTML = '';

        var filename = $scope.image.path.replace(/^.*[\\\/]/, '');
        var file_noExtenstion = filename.replace(/\.[^/.]+$/, "");

        console.log(file_noExtenstion);

        var params = {
            Key: $scope.profile.email + '/' + $scope.tripID + '/' + file_noExtenstion + '.txt',
            Body: JSON.stringify(gps_point)
        };
        bucket_create_photo_gps.upload(params, function (err, data) {
            results.innerHTML = err ? 'ERROR!' : 'SAVED.';
        });
        // }, false);

    }

    $scope.editModeSwitch = function () {
        $scope.editMode = !$scope.editMode;
        if ($scope.editMode == true) {
            $scope.editButtonText = 'View Mode';
            $scope.openNav();
        }
        else {
            $scope.editButtonText = 'Edit Mode';
            $scope.closeNav();
        }
    }

    $scope.panoView = function () {
        if($scope.panoViewState == false){

           // var path = polys[].getPath();
            var panorama = new google.maps.StreetViewPanorama(
                document.getElementById('pano'), {
                    position: path.pop()
                });

            $scope.map.setStreetView(panorama);

            document.getElementById("pano").style.width = "50%";
            $scope.panoViewState = true;
        }else{
            document.getElementById("pano").style.width = "0%";
            document.getElementById("map").style.width = "100%";
            $scope.panoViewState = false;
        }

    }

    //**********************  load Tips from Firebase ******************
    //******************************************************************
    //******************************************************************
    var firebase_ref_readTips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + facebookId + '/' + $scope.tripID + '/messages');

    firebase_ref_readTips.on("value", function (snapshot) {
        $scope.messages = [];
        snapshot.forEach(function (childSnapshot) {
            //var key = childSnapshot.key();
            var childData = childSnapshot.val(); // childData = location and message and time
            //$scope.messages.unshift(childData['message']);
            $scope.messages.unshift(childData);
        });
        $scope.$apply();

    }, function (errorObject) {
        console.log("Read Tips from Firebase failed: " + errorObject.code);
    });


    //************************
    //*******************************handle paths
    //*******************************************************************
    //path for each user
    var path = [];
    var ref_read_path = new Firebase('https://luminous-torch-9364.firebaseio.com/mobile/users/' + facebookId + '/' + $scope.tripID + '/path');

    //read path for user 'users.key()' trip 'trip.key()' that have active trip
    var firstLoad_paths = true;

    ref_read_path.once("value", function (tripPath) {
        tripPath.forEach(function (point) {
            path.push({
                lat: JSON.parse(point.val()['coords'].latitude),
                lng: JSON.parse(point.val()['coords'].longitude)
            });

        })

        //set the path for the first load, for the real time load, I added the same code into the listener of Firebase above
        //dashed line
        var lineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 4
        };

        //Hash table for all users path
        polys[facebookId] = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#000000', //getRandomColor(),
            strokeOpacity: 0,
            strokeWeight: 2,
            icons: [{
                icon: lineSymbol,
                offset: '0',
                repeat: '20px'
            }]
        });

        polys[facebookId].setMap($scope.map);

        $scope.map.setCenter(path.pop());
        $scope.map.setZoom(12);
    })


    //load Table from Firebase
    var firebase_ref_readTable = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + facebookId + '/' + $scope.tripID + '/table');

    firebase_ref_readTable.on("value", function (snapshot) {
        $scope.table = []; //reset table
        snapshot.forEach(function (childSnapshot) {
            // key will be "fred" the first time and "barney" the second time
            var key = childSnapshot.key();
            // childData will be the actual contents of the child
            var childData = childSnapshot.val();

            var day = {};
            day[key] = childData;
            $scope.table.push(day);
        });
        //$scope.$apply();

    }, function (errorObject) {
        console.log("Read Table from Firebase failed: " + errorObject.code);
    });


    // ###################################################################
    // Edit Mode - Start
    // ##################################################################

    $scope.addDay = function () {
        console.log('Offline page:: add day');
        console.log($scope.day);

        var firebase_table = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + facebookId + "/" + $scope.tripID + "/table/" + $scope.day.dayNumber);
        firebase_table.set($scope.day);
    }

    $scope.addMessage = function () {
        // add a new note to firebase
        var message_json = {};

        var firebase_tips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + facebookId + '/' + $scope.tripID + '/tips');

        //var usersRef = firebase_ref.child('history');


        // should change it to be similar to how the mobile device add push the message
        message_json = {
            "message": {
                "text": $scope.message.text,
                "latitude": $scope.message.lat,
                "longitude": $scope.message.lng,
                "timestamp": $scope.message.time
            }
        }
        firebase_tips.push(message_json);
    }

    // ###################################################################
    // Edit Mode - End
    // ##################################################################


    //*******************************************************************************************************
    //Help functions
    //Read text file from AWS S3
    //no need for the below fun I used $http req
    var readTextFile = function (file) {
        var file_content = '';
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = function () {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    var allText = rawFile.responseText;
                    file_content = allText;
                }
            }
        }
        rawFile.send(file_content);
    }


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

    // the smooth zoom function
    function smoothZoom(map, max, cnt) {
        if (cnt >= max) {
            return;
        }
        else {
            z = google.maps.event.addListener(map, 'zoom_changed', function (event) {
                google.maps.event.removeListener(z);
                smoothZoom(map, max, cnt + 1);
            });
            setTimeout(function () {
                map.setZoom(cnt)
            }, 80); // 80ms is what I found to work well on my system -- it might not work well on all systems
        }
    }

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




//*********************************************
//**************** Help functions *************
//*********************************************

//help function
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

