trackerApp.controller('tripCtrl', function ($rootScope, $scope, $sce, $q, $timeout, $stateParams, $firebaseObject, $firebaseArray, $http, $state, $document, $interval, dataBaseService, messages, serverSvc, localStorageService, Facebook, $filter, ngProgressFactory, nearbyPlacesFactory, nearbyPlacesFacebook) {
        //Variables Init
        $scope.loading = true;
        $scope.tripID = $stateParams.id;//localStorageService.get('tripId');
        $scope.profile = localStorageService.get('profile');
        $scope.userAccessToken = localStorageService.get('providerToken');

        if (!$scope.profile) {
            console.log('Trip:: auth :: no data about the user, profile is empty');
        }

        $scope.load_progress = 1;
        $scope.user = messages.getUser(); //replace with local service like next line
        //Right panel buttons
        $scope.tips_button = false;
        $scope.places_button = true;
        $scope.routes_button = false;
        $scope.expense_button = false;
        //Right panel, switches
        $scope.tips_items_flag = true;
        $scope.places_items_flag = true;

        $scope.travelersList = [];
        $scope.data = [];                   //Travellers from PG DB
        $scope.messages = [];               //Tips from Firebase, based on GPS point

        var markers_places = [];            //used in showPlaceOnMap
        var markers_tips = [];              //used in showTipOnMap
        $scope.editMode = false;
        $scope.panoViewState = false;
        $scope.panoPosition = '';
        $scope.editButtonText = 'Edit Mode';
        var showMessageOnMap_clicked = false;
        $scope.pathSaved = [];
        $scope.pathLoaded = false;

        //Filter for the tips
        $scope.showAllTips = true;
        $scope.showTips = false;
        $scope.showRisks = false;
        $scope.showExpense = false;
        $scope.showInvite = false;

        //Buttons
        $scope.photosSlider = true;
        $scope.tableSlider = true;
        $scope.inforSlide = true;
        $scope.drawing_panel = false;
        $scope.information_panel = true;

        $scope.noTripId = false;

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

        $scope.items = [];

        $scope.selectedFacebookAlbum = [];
        $scope.facebookAlbumsList = []; //Facebook albums from Firebase
        $scope.pathHash = [];
        $scope.trip_created_manually = true;

        $scope.columns = [
            {title: 'Name', field: 'name', visible: true, filter: {'name': 'text'}},
            {title: 'Age', field: 'age', visible: true},
            {title: 'country', field: 'add', visible: true, subfield: 'coun'}
        ];
        $rootScope.Utils = {
            keys: Object.keys
        }
        //** small help functions **//
        //remove mouse over event, make it too much
        $scope.photoMouseOver = function (event) {
            //console.log(event.target);
            $scope.showPhotoOnMap(event.target);
        }
        $scope.openDrawingPanel = function () {
            $scope.drawing_panel = true;
        }
        $scope.openInformationPanel = function () {
            $scope.information_panel = true;
        }
        $scope.openNav = function () {
            document.getElementById("mySidenav").style.width = "420px";
        }
        $scope.closeNav = function () {
            document.getElementById("mySidenav").style.width = "0";
        }

        //Get trip Id to start working on the trip
        //############ Main closure ###################### //
        var dataTripId = {trip_id: $scope.tripID};

        if ($scope.tripID) { //if no trip id then nothing will work, show message in that case

            dataBaseService.getTripById(dataTripId).then(function (results) {
                    $scope.trip = results.data;
                    $scope.tripName = $scope.trip[0].trip_name;
                    $scope.tripDescription = $scope.trip[0].trip_description;
                    $scope.cities = $scope.trip[0].cities;

                    $scope.citites_list = '';
                    if ($scope.cities) {
                        for (var index = 0; index < $scope.cities.length; index++) {
                            if (index == 0) {
                                $scope.citites_list = $scope.cities[index].label;
                            } else {
                                $scope.citites_list = $scope.citites_list + ' , ' + $scope.cities[index].label;
                            }
                        }
                    }
                    $scope.dateStart = $filter('date')($scope.trip[0].start_date, 'MMM d, y');
                    $scope.dateEnd = $filter('date')($scope.trip[0].end_date, 'MMM d, y');

                    //Date to be used for slider, helps to add days on top of start day
                    //Date to be used for slider, helps to add days on top of start day
                    $scope.startDateSlider = new Date($scope.trip[0].start_date);
                    $scope.startDateSliderForPath = new Date($scope.trip[0].start_date);

                    $scope.facebookId = $scope.trip[0].facebook_id;

                    if ($scope.trip[0].continent) {
                        $scope.continent = $scope.trip[0].continent[0];
                    }
                    $scope.test = new Date($scope.trip[0].start_date);

                    $scope.tripDays = Math.abs(Math.floor((Date.parse($scope.dateStart) - Date.parse($scope.dateEnd)) / 86400000));

                    $scope.day = 0;
                    $scope.days = [];
                    //Select day to filter trip
                    for (var i = 0; i < $scope.tripDays; i++) {
                        $scope.days.push(i);
                    }

                    $scope.photosSource = $scope.trip[0].photos_provider;

                    if ($scope.photosSource == 'aws') {
                        $scope.awsProvider = true;
                        $scope.facebookProvider = false;
                    } else {
                        $scope.awsProvider = false;
                        $scope.facebookProvider = true;
                    }
                    $scope.enableFacebookProvider = function () {
                        $scope.awsProvider = false;

                        var obj = {trip_id: $scope.tripID, photos_provider: 'facebook'};
                        dataBaseService.updateTripPhotosProvider(obj).then(function (results) {
                        });
                    };

                    $scope.enableAwsProvider = function () {
                        $scope.facebookProvider = false;

                        var obj = {trip_id: $scope.tripID, photos_provider: 'aws'};
                        dataBaseService.updateTripPhotosProvider(obj).then(function (results) {
                        });
                    };

                    var firebase_config_get_albums = new Firebase("https://trackerconfig.firebaseio.com/web/" + $scope.facebookId + "/offline/photos/facebook/trip/" + $scope.tripID);

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
                                    "/" + $scope.facebookAlbumsFriebase[i].albumID + "/photos?access_token=" + $scope.userAccessToken,
                                    function (album) {
                                        if (album && !album.error) {
                                            //console.log('photos');
                                            for (var photoIndex = 0; photoIndex < album.data.length; photoIndex++) {
                                                Facebook.api(
                                                    "/" + album.data[photoIndex].id + "/picture?access_token=" + $scope.userAccessToken,
                                                    function (photo) {
                                                        if (photo && !photo.error) {
                                                            /* handle the result */
                                                            //console.log(photo.data.url);
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
                                                    //console.log('ready');
                                                    //$scope.$apply();
                                                }
                                            }
                                        }
                                    });
                            }
                        }
                    }, function (errorObject) {
                        console.log("The read failed: " + errorObject.code);
                    });

                    //get all facebook user albums
                    //read albums from Facebook for:
                    // 1. update edit mode list witht he enabled albums
                    Facebook.api(
                        "/" + $scope.facebookId + "/albums?access_token=" + $scope.userAccessToken,
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
                                }
                            }
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
                    var firebase_ref = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID);


                    if ($scope.facebookId == '' || $scope.tripID == '')
                        alert('no facebook id or trip id')
                    //AWS Config
                    AWS.config.credentials = new AWS.Credentials('AKIAIGEOPTU4KRW6GK6Q', 'VERZVs+/nd56Z+/Qxy1mzEqqBwUS1l9D4YbqmPoO');

                    // Configure your region
                    AWS.config.region = 'us-west-2';

                    // below AWS S3 code used to get photos and show in offline page
                    var S3URL = 'https://s3-us-west-2.amazonaws.com/';
                    var S3CDN = 'http://dcfzra40jo7ha.cloudfront.net/';
                    var S3URL_RESIZE = 'http://tracker.photos.s3-website-us-west-2.amazonaws.com/'
                    $scope.photos = [];


                    Facebook.getLoginStatus(function (response) {
                        if (response.status == 'connected') {
                            console.log('user is connected')
                        }
                    });

                    //Sync Facebook albums
                    $scope.syncAlbums = function () {
                        //save in Firebase config
                        var firebase_config_albums = new Firebase("https://trackerconfig.firebaseio.com/web/" + $scope.facebookId + "/offline/photos/facebook/trip/" + $scope.tripID);
                        firebase_config_albums.set($scope.facebookAlbums);

                        $scope.facebookPhotos = [];
                        var coverSelected = false;
                        //console.log($scope.facebookAlbums);
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
                                                //console.log("https://trackerconfig.firebaseio.com/web/" + facebookId + "/tripslist/coverphoto/trip/" + $scope.tripID);
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
                                            //console.log('photos');
                                            for (var photoIndex = 0; photoIndex < album.data.length; photoIndex++) {
                                                Facebook.api(
                                                    "/" + album.data[photoIndex].id + "/picture",
                                                    function (photo) {
                                                        if (photo && !photo.error) {
                                                            //console.log(photo.data.url);
                                                            $scope.facebookPhotos.push(photo.data.url);
                                                            //console.log($scope.facebookAlbums);
                                                        }
                                                    });
                                            }
                                        }
                                    });
                            }
                        }
                    }

                    var bucket = new AWS.S3({
                        params: {
                            Bucket: 'tracker.photos',
                            //Marker: localStorageService.get('email') + '/' + chunk.id
                            Delimiter: '/',
                            Prefix: $scope.facebookId + '/' + $scope.tripID + '/'
                        }
                    });

                    bucket.listObjects(function (err, data) {
                        if (err) {
                            document.getElementById('status').innerHTML =
                                'Could not load objects from S3';
                        } else {
                            //document.getElementById('status').innerHTML =
                            //'Loaded ' + data.Contents.length + ' items from S3';
                            for (var i = 0; i < data.Contents.length; i++) {
                                var photo_extenstion = data.Contents[i].Key.split('.').pop();

                                if (photo_extenstion == "gif" || photo_extenstion == "png" || photo_extenstion == "bmp" || photo_extenstion == "jpeg" || photo_extenstion == "jpg" || photo_extenstion == "GIF" || photo_extenstion == "PNG" || photo_extenstion == "BMP" || photo_extenstion == "GPEG" || photo_extenstion == "JPG") {
                                    //$scope.photos.push(S3URL + 'tracker.photos/' + data.Contents[i].Key);
                                    //$scope.photos[i].fullres = $sce.trustAsResourceUrl($scope.photos[i].fullres);

                                    //use S3 URL without CDN
                                    //var strict_escape_url = $sce.trustAsResourceUrl(S3URL + 'tracker.photos/' + data.Contents[i].Key);
                                    // $scope.photos.push({fullres: strict_escape_url, thumbnail: S3URL + 'tracker.photos/' + data.Contents[i].Key});

                                    //use S3 CDN + S3 Lambda resize API
                                    var strict_escape_url = $sce.trustAsResourceUrl(S3CDN + data.Contents[i].Key);
                                    $scope.photos.push({
                                        fullres: strict_escape_url,
                                        thumbnail: S3URL_RESIZE + '100x100/' + data.Contents[i].Key
                                    });
                                    //use resize Lambda API Example:
                                    //http://tracker.photos.s3-website-us-west-2.amazonaws.com/150x150/10207022211887806/216/IMG_3516.JPG
                                }
                                //$scope.$apply(); becaus of disableing this, AWS images for the will not be rendered directly after upload, only when refresh
                            }
                        }
                    });
                    //upload file to AWS S3
                    var bucket_upload = new AWS.S3({params: {Bucket: 'tracker.photos'}}); // should I use a new bucket variable?

                    var fileChooser = document.getElementById('file-chooser');
                    var button = document.getElementById('upload-button');
                    var results = document.getElementById('results');
                    /*          button.addEventListener('click', function () {

                     //if it's a KML file then override the exists one, save it in the same name
                     var file = fileChooser.files[0];
                     var file_extenstion = file.name.split('.').pop();
                     if (file_extenstion == 'kml' || file_extenstion == 'KML') {

                     if (file) {
                     results.innerHTML = '';

                     var params = {
                     Key: $scope.facebookId + '/' + $scope.tripID + '/' + 'map_kml.kml',
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

                     for (var i = 0; fileChooser.files.length > 0; i++) {
                     var file = fileChooser.files[i];
                     var file_extenstion = file.name.split('.').pop();

                     if (file_extenstion == "gif" || file_extenstion == "png" || file_extenstion == "bmp" || file_extenstion == "jpeg" || file_extenstion == "jpg" || file_extenstion == "GIF" || file_extenstion == "PNG" || file_extenstion == "BMP" || file_extenstion == "GPEG" || file_extenstion == "JPG") {
                     if (file) {
                     //resizeImage(file);
                     results.innerHTML = '';
                     /!*  var params = {
                     Key: $scope.profile.email + '/' + $scope.tripID + '/' + file.name,
                     ContentType: file.type,
                     Body: file
                     };*!/
                     var params = {
                     Key: $scope.facebookId + '/' + $scope.tripID + '/' + file.name,
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
                     }

                     }, false);*/

                    var users_hash = {};
                    var polys = []; // will hold poly for each user

                    //$scope.init = function () {
                    var trackCoordinates = []; // for new GPS points


                    //************************* Map settings ****************************
                    //*******************************************************************

                    $scope.map;
                    $scope.lastGPSpoint = "";

                    var moveToLocation = function (lat, lng) {
                        var center = new google.maps.LatLng(lat, lng);
                        // using global variable:
                        $scope.map.panTo(center);
                    }

                    //Map configuration
                    var iframe = document.getElementById('iframe');
                    iframe.contentWindow.document.open();
                    iframe.contentWindow.document.write('<div id="map" style="width: 100%; height: 100%"></div>');
                    iframe.contentWindow.document.write('<input id="pac-input" class="form-control" type="text" placeholder="Search Location" style="width: 200px">');
                    iframe.contentWindow.document.close();

                    var mapContainer = iframe.contentWindow.document.querySelector('#map');
                    $scope.map = new google.maps.Map(mapContainer, {
                        //center: {lat: 34.397, lng: 40.644},
                        center: {lat: 0, lng: 0},
                        zoom: 8,
                        mapTypeControl: true,
                        mapTypeControlOptions: {
                            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                            position: google.maps.ControlPosition.LEFT_TOP
                        },
                        mapTypeId: google.maps.MapTypeId.TERRAIN,
                        zoomControl: true,
                        zoomControlOptions: {
                            position: google.maps.ControlPosition.LEFT_BOTTOM
                        },
                        scaleControl: true,
                        streetViewControl: false,
                        streetViewControlOptions: {
                            position: google.maps.ControlPosition.LEFT_CENTER
                        },
                        styles: [
                            {
                                "elementType": "geometry",
                                "stylers": [
                                    {
                                        "color": "#ebe3cd"
                                    }
                                ]
                            },
                            {
                                "elementType": "labels.text.fill",
                                "stylers": [
                                    {
                                        "color": "#523735"
                                    }
                                ]
                            },
                            {
                                "elementType": "labels.text.stroke",
                                "stylers": [
                                    {
                                        "color": "#f5f1e6"
                                    }
                                ]
                            },
                            {
                                "featureType": "administrative",
                                "elementType": "geometry.stroke",
                                "stylers": [
                                    {
                                        "color": "#c9b2a6"
                                    }
                                ]
                            },
                            {
                                "featureType": "administrative.land_parcel",
                                "elementType": "geometry.stroke",
                                "stylers": [
                                    {
                                        "color": "#dcd2be"
                                    }
                                ]
                            },
                            {
                                "featureType": "administrative.land_parcel",
                                "elementType": "labels.text.fill",
                                "stylers": [
                                    {
                                        "color": "#ae9e90"
                                    }
                                ]
                            },
                            {
                                "featureType": "landscape.natural",
                                "elementType": "geometry",
                                "stylers": [
                                    {
                                        "color": "#dfd2ae"
                                    }
                                ]
                            },
                            {
                                "featureType": "poi",
                                "elementType": "geometry",
                                "stylers": [
                                    {
                                        "color": "#dfd2ae"
                                    }
                                ]
                            },
                            {
                                "featureType": "poi",
                                "elementType": "labels.text.fill",
                                "stylers": [
                                    {
                                        "color": "#93817c"
                                    }
                                ]
                            },
                            {
                                "featureType": "poi.park",
                                "elementType": "geometry.fill",
                                "stylers": [
                                    {
                                        "color": "#a5b076"
                                    }
                                ]
                            },
                            {
                                "featureType": "poi.park",
                                "elementType": "labels.text.fill",
                                "stylers": [
                                    {
                                        "color": "#447530"
                                    }
                                ]
                            },
                            {
                                "featureType": "road",
                                "elementType": "geometry",
                                "stylers": [
                                    {
                                        "color": "#f5f1e6"
                                    }
                                ]
                            },
                            {
                                "featureType": "road.arterial",
                                "elementType": "geometry",
                                "stylers": [
                                    {
                                        "color": "#fdfcf8"
                                    }
                                ]
                            },
                            {
                                "featureType": "road.highway",
                                "elementType": "geometry",
                                "stylers": [
                                    {
                                        "color": "#f8c967"
                                    }
                                ]
                            },
                            {
                                "featureType": "road.highway",
                                "elementType": "geometry.stroke",
                                "stylers": [
                                    {
                                        "color": "#e9bc62"
                                    }
                                ]
                            },
                            {
                                "featureType": "road.highway.controlled_access",
                                "elementType": "geometry",
                                "stylers": [
                                    {
                                        "color": "#e98d58"
                                    }
                                ]
                            },
                            {
                                "featureType": "road.highway.controlled_access",
                                "elementType": "geometry.stroke",
                                "stylers": [
                                    {
                                        "color": "#db8555"
                                    }
                                ]
                            },
                            {
                                "featureType": "road.local",
                                "elementType": "labels.text.fill",
                                "stylers": [
                                    {
                                        "color": "#806b63"
                                    }
                                ]
                            },
                            {
                                "featureType": "transit.line",
                                "elementType": "geometry",
                                "stylers": [
                                    {
                                        "color": "#dfd2ae"
                                    }
                                ]
                            },
                            {
                                "featureType": "transit.line",
                                "elementType": "labels.text.fill",
                                "stylers": [
                                    {
                                        "color": "#8f7d77"
                                    }
                                ]
                            },
                            {
                                "featureType": "transit.line",
                                "elementType": "labels.text.stroke",
                                "stylers": [
                                    {
                                        "color": "#ebe3cd"
                                    }
                                ]
                            },
                            {
                                "featureType": "transit.station",
                                "elementType": "geometry",
                                "stylers": [
                                    {
                                        "color": "#dfd2ae"
                                    }
                                ]
                            },
                            {
                                "featureType": "water",
                                "stylers": [
                                    {
                                        "color": "#3388ff"
                                    }
                                ]
                            },
                            {
                                "featureType": "water",
                                "elementType": "geometry.fill",
                                "stylers": [
                                    {
                                        "color": "#3cadf2"
                                    }
                                ]
                            },
                            {
                                "featureType": "water",
                                "elementType": "geometry.stroke",
                                "stylers": [
                                    {
                                        "color": "#3388ff"
                                    }
                                ]
                            },
                            {
                                "featureType": "water",
                                "elementType": "labels.text.fill",
                                "stylers": [
                                    {
                                        "color": "#92998d"
                                    }
                                ]
                            }
                        ]
                    });

                    var drawingManager = new google.maps.drawing.DrawingManager({
                        drawingMode: google.maps.drawing.OverlayType.MARKER,
                        drawingControl: true,
                        drawingMode: null,
                        drawingControlOptions: {
                            position: google.maps.ControlPosition.TOP_CENTER,
                            drawingModes: ['marker', 'circle', 'polygon', 'polyline', 'rectangle']
                        },
                        markerOptions: {
                            icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
                            // This marker is 20 pixels wide by 32 pixels high.
                            size: new google.maps.Size(200, 200),
                            // The origin for this image is (0, 0).
                            origin: new google.maps.Point(90, 70),
                            // The anchor for this image is the base of the flagpole at (0, 32).
                            anchor: new google.maps.Point(300, 302)
                        },

                        circleOptions: {
                            fillColor: '#ffff00',
                            fillOpacity: 1,
                            strokeWeight: 5,
                            clickable: false,
                            editable: true,
                            zIndex: 1
                        }
                    });
                    //drawingManager.setMap($scope.map);

                    // Create the search box and link it to the UI element.
                    //var input = document.getElementById('pac-input');
                    var input = iframe.contentWindow.document.querySelector('#pac-input');
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


                    // %%%% Listeners to save drawing data to firebase %%%%
                    $scope.circles = [];
                    $scope.markers = [];
                    $scope.polylines = [];

                    //////circles
                    var firebase_drawing_circles = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/map/circles');
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
                        circle.set("id", "New circle");
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
                    var firebase_drawing_markers = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/map/markers');
                    google.maps.event.addDomListener(drawingManager, 'markercomplete', function (marker) {
                        console.log('new marker added to firebase');
                        //console.log(marker);
                        firebase_drawing_markers.push({
                            icon: marker.icon,
                            position: {lat: marker.position.lat(), lng: marker.position.lng()}
                        });

                        //draw the marker directlly (no need to read again all items from firebase)
                        marker.set("id", "New marker");
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
                    var firebase_drawing_polyline = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/map/polylines');
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


                    $scope.map.addListener('click', function (e) {
                        $scope.message = {lat: e.latLng.lat(), lng: e.latLng.lng()};
                        //$scope.$apply(); I don't know what will be the behave after disable this
                    });

                    var ctaLayer = new google.maps.KmlLayer({
                        url: 'https://s3-us-west-2.amazonaws.com/tracker.photos/' + $scope.facebookId + '/' + $scope.tripID + '/map_kml.kml',
                        map: $scope.map
                    });

                    $scope.showMessageOnMap = function (message) {
                        if ($scope.editMode == false) {
                            if (message.location.coords) {
                                //Help function - show item on map
                                $scope.showTipOnMap(message);
                            }

                            /*    $timeout(function () {
                             $scope.map.setZoom(5);
                             }, 10000);*/


                            /*        //#646c73
                             if (showMessageOnMap_clicked == false) {
                             showMessageOnMap_clicked = true;
                             var Latlng_message = {lat: message.location.coords.latitude, lng: message.location.coords.longitude};

                             //Help function - show item on map
                             showItemOnMap(Latlng_message, message);

                             } else {
                             showMessageOnMap_clicked = false;
                             //if clicked again, the marker should deleted and back the zoom to normal
                             $scope.map.setZoom(5);
                             }*/
                        }
                    }


                    $scope.showPhotoOnMap = function (element) {
                        var image = element.src;


                        serverSvc.getPhotoMetadata(image).then(function (result) {

                            console.log(result.data);

                        })


                        /*
                         //console.log(image.currentTarget.childNodes[1]);
                         //var img = image.currentTarget.childNodes[1];  //the second element is IMG, should add validation
                         var img = image;
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


                         //var fileGpsUrl = S3URL + 'tracker.photos/' + $scope.facebookId + '/' + $scope.tripID + '/' + file_noExtenstion + '.txt';

                         var fileGpsUrl = S3CDN + $scope.facebookId + '/' + $scope.tripID + '/' + file_noExtenstion + '.txt';

                         //console.log(fileGpsUrl);

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
                         } */
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
                            Key: $scope.facebookId + '/' + $scope.tripID + '/' + file_noExtenstion + '.txt',
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
                        } else {
                            $scope.editButtonText = 'Edit Mode';
                            $scope.closeNav();
                        }
                    }

                    $scope.panoView = function () {
                        if ($scope.panoViewState == false) {

                            // var path = polys[].getPath();
                            /*    $scope.panorama = new google.maps.StreetViewPanorama(
                             document.getElementById('pano'), {
                             position: path.pop()
                             });*/

                            $scope.panorama = new google.maps.StreetViewPanorama(
                                document.getElementById('pano'), {
                                    position: $scope.panoPosition
                                })

                            $scope.map.setStreetView($scope.panorama);

                            document.getElementById("pano").style.width = "50%";
                            $scope.panoViewState = true;
                        } else {
                            document.getElementById("pano").style.width = "0%";
                            document.getElementById("map").style.width = "100%";
                            $scope.panoViewState = false;
                        }

                    }

                    //**********************  load Tips from Firebase ******************
                    //******************************************************************
                    //******************************************************************

                    //bot Auto / Manual trips load the same messages, the same structure
                    var firebase_ref_readTips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/messages');


                    //load messages to the right panel list + draw on map
                    firebase_ref_readTips.on("value", function (snapshot) {
                        $scope.messages = [];
                        snapshot.forEach(function (childSnapshot) {
                            var childData = childSnapshot.val(); // childData = location, message and time
                            childData.time = Date.parse(childData.time);

                            var id = $scope.messages.length;
                            childData.id = id;
                            //load to list
                            $scope.messages.unshift(childData);

                            //Help function - show item on map
                            $scope.showTipOnMap(childData);
                        });
                    }, function (errorObject) {
                        console.log("Read Tips from Firebase failed: " + errorObject.code);
                    });

                    /* $scope.showMessageOnMap = function (message) {
                     if ($scope.editMode == false) {
                     if (message.location.coords) {
                     var Latlng_message = {
                     lat: message.location.coords.latitude,
                     lng: message.location.coords.longitude
                     };
                     //Help function - show item on map
                     showItemOnMap(Latlng_message, message);
                     }*/


                    //}

                    //****************************************************


                    //************************************************************


                    //************************
                    //******************************* handle paths
                    //*******************************************************************
                    //SERVER SIDE CPU - Faster
                    $scope.load_progress = 40;
                    $timeout(function () {
                        $scope.load_progress = 90;
                    }, 2000);
                    ////// Check GPS point accuracy
                    $scope.checkAccuracy = function (GPS_Point, accuracy) {
                        //console.log(GPS_Point['coords'].accuracy);
                        if (GPS_Point['coords'].accuracy < accuracy) {
                            return true;
                        }
                    }

                    $scope.pathLoaded = true;

                    //try to load path from server that was recrded by app even if it is empty
                    //if (!$scope.trip_created_manually) { // load path from server only when the path was created by APP

                    //Get Path in hash table from server

                    //***************** Load path from server **********************


                    var data = {userId: $scope.facebookId, tripId: $scope.tripID, tripDays: $scope.tripDays};
                    dataBaseService.getTripPathHash(data).then(function (results) {
                        $scope.trip_path_hash = results.data;
                        messages.savePath(results.data);

                        if ($scope.trip_path_hash) { // if not empty then draw path
                            //create polyline for each day
                            var lineSymbol = {
                                //path: 'M 0,-1 0,1',
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                strokeOpacity: 1,
                                scale: 2,
                            };

                            $scope.polys_per_day = new Array($scope.trip_path_hash.length);
                            for (var poly_index = 0; poly_index < $scope.trip_path_hash.length; poly_index++) {
                                //Hash table for all users path
                                $scope.polys_per_day[poly_index] = new google.maps.Polyline({
                                    map: $scope.map,
                                    path: $scope.trip_path_hash[poly_index],
                                    geodesic: true,
                                    //strokeColor: '#000000', //getRandomColor(), #E38C2D
                                    strokeColor: '#000000',
                                    strokeOpacity: 0,
                                    strokeWeight: 2,
                                    icons: [{
                                        icon: lineSymbol,
                                        offset: '0',
                                        repeat: '20px'
                                    }]
                                });
                            }

                            var index = 0;
                            while ($scope.trip_path_hash[index].length > 0) {
                                index++;
                            }
                            var center_index = Math.floor(index / 2);
                            if ($scope.trip_path_hash[center_index][0] != null) {
                                var lat = $scope.trip_path_hash[center_index][0].lat;
                                var lng = $scope.trip_path_hash[center_index][0].lng;
                                $scope.map.panTo(new google.maps.LatLng(lat, lng));
                            }

                            //$scope.$apply();

                            console.log($scope.polys_per_day);
                            $scope.polys_per_day_temp = $scope.polys_per_day; // to be used as backup when filter
                            $scope.pathLoaded = true;
                            if ($scope.polys_per_day.length > 0) {
                                $scope.map.setCenter($scope.trip_path_hash[0].pop());
                            }
                            $scope.map.setZoom(7);

                            //Get places for the current path
                            //$scope.loadNearByPlaces($scope.trip_path_hash);
                            //Get Places
                            //dataBaseService.getTripPlaces({path: $scope.trip_path_hash}).then(function (results) {
                            //});



                            // ********* Create routes from recorded path *****************
                            // each day is a route in this case
                            // simulate route data to keep the same structure for UI route.routes[0].summary

                            // $scope.routes_settings = {enable_routes_map: true};

                            for (var i = 0; i < $scope.trip_path_hash.length; i++) {
                                var routes = new Array(0);
                                if (i == 0) {
                                    routes[0] = {summary: 'Route - All days', hash_index: i};
                                } else {
                                    routes[0] = {summary: 'Route in day ' + i, hash_index: i};
                                }
                                // hash index will be the pointed to the hash table in case user click on route
                                var route = {routes: routes};
                                $scope.routes_list.push(route);
                            }


                            
                        }
                    });
//***************** End load path from server **********************

                    //}


                    ///////// **** Maps Trip Path Helper function ****** /////////
                    //Filter polylines by day
                    $scope.filter_trip_paths_by_day = function (day) {
                        //Stop animation in case it is running
                        $scope.stop_path_animation();

                        $scope.selectedDay = day;
                        if (day == 0) { // enable all polys
                            for (var i = 0; i < $scope.polys_per_day.length; i++) {
                                $scope.polys_per_day[i].setMap($scope.map);
                            }
                            $scope.map.setCenter($scope.trip_path_hash[1].pop());
                            $scope.map.setZoom(7);
                        } else { // disable all expect the selected day
                            for (var i = 0; i < $scope.polys_per_day.length; i++) {
                                if (day != i) {
                                    $scope.polys_per_day[i].setMap(null);
                                }
                                if (day == i) {
                                    $scope.polys_per_day[i].setMap($scope.map);
                                    $scope.map.setCenter($scope.trip_path_hash[i].pop());
                                    $scope.map.setZoom(7);
                                }
                            }
                        }
                    };
                    // disable all trip paths from map
                    $scope.trip_disable_all_paths = function () {
                        for (var i = 0; i < $scope.polys_per_day.length; i++) {
                            $scope.polys_per_day[i].setMap(null);
                        }
                        //Stop animation if running
                        $scope.stop_path_animation();
                    };
                    // enable all trip paths on map
                    $scope.trip_enable_all_paths = function () {
                        for (var i = 0; i < $scope.polys_per_day.length; i++) {
                            $scope.polys_per_day[i].setMap($scope.map);
                        }
                    };
                    // disable all trip markers from map
                    $scope.trip_disable_all_markers = function () {
                        for (var i = 0; i < $scope.markers.length; i++) {
                            $scope.markers[i].setMap(null);
                        }
                    };
                    // enable all trip markers on map
                    $scope.trip_enable_all_markers = function () {
                        for (var i = 0; i < $scope.markers.length; i++) {
                            $scope.markers[i].setMap($scope.map);
                        }
                    };

                    //disable all tips on map
                    $scope.trip_disable_all_tips = function () {
                        for (var i = 0; i < markers_tips.length; i++) {
                            //markers_tips[i].marker.setMap(null);
                            markers_tips[i].info.close();
                        }
                    };
                    //enable all tips on map
                    $scope.trip_enable_all_tips = function () {
                        for (var i = 0; i < markers_tips.length; i++) {
                            markers_tips[i].marker.setMap($scope.map);
                            //markers_tips[i].info.open($scope.map, markers_messages[i].info);
                        }
                    };

                    //disable all places on map
                    $scope.trip_disable_all_places = function () {
                        for (var i = 0; i < markers_places.length; i++) {
                            //markers_places[i].marker.setMap(null);
                            markers_places[i].info.close();
                        }
                    };
                    //enable all places on map
                    $scope.trip_enable_all_places = function () {
                        for (var i = 0; i < markers_places.length; i++) {
                            markers_places[i].marker.setMap($scope.map);
                            //markers_places[i].info.open($scope.map, markers_messages[i].info);
                        }
                    };

                    //Stop path animation
                    $scope.stop_path_animation = function () {
                        if (poly_animation != null) {
                            poly_animation.setMap(null);
                            poly_animation = null;
                            $scope.path_animating = false;
                            //update button icon
                            $scope.animate_button_icon = 'assets/icons/ic_play_circle_outline_white_48dp_1x.png';
                        }
                    }
                    //************ animate path **************************
                    var poly_animation = null;
                    $scope.path_animating = false;
                    $scope.animate_button_icon = 'assets/icons/ic_play_circle_outline_white_48dp_1x.png';

                    function animateCircle(line) {
                        var count = 0;
                        var pathArray = line.getPath().getArray();
                        window.setInterval(function () {
                            count = (count + 1) % 200;
                            var icons = line.get('icons');
                            icons[0].offset = (count / 2) + '%';
                            line.set('icons', icons);
                            //moveToLocation(pathArray[count].lat(), pathArray[count].lng() );
                        }, 300);
                    }

                    $scope.runPathAnimation = function () {
                        //$scope.trip_disable_all_paths();
                        if ($scope.path_animating == false && $scope.selectedDay > 0) {
                            var lineSymbolCircle = {
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                strokeColor: '#393'
                            };
                            poly_animation = new google.maps.Polyline({
                                map: $scope.map,
                                path: $scope.trip_path_hash[$scope.selectedDay],
                                icons: [{
                                    icon: lineSymbolCircle,
                                    offset: '100%'
                                }]
                            });
                            $scope.animate_button_icon = 'assets/icons/ic_stop_white_48dp_1x.png';
                            $scope.path_animating = true;
                            animateCircle(poly_animation);
                        } else {
                            //Stop animation
                            $scope.stop_path_animation();
                        }

                    }

                    $scope.loadNearByPlaces = function (path) {
                        // load nearby places:
                        $scope.nearbyPlaces = {};
                        $scope.nearbyPlacesReady = false;
                        $scope.iterateOverPathProgress = 0;
                        $scope.iterateOverNearbyPlacesProgress = 0;
                        var nearbyPlaces = new nearbyPlacesFactory($scope.map, path);
                        nearbyPlaces.on('error', function (event, error) {
                            console.log(error);
                        });
                        nearbyPlaces.on('ready', function () {
                            $scope.nearbyPlaces = nearbyPlaces.nearbyPlaces();
                            $scope.nearbyPlacesReady = true;
                            //push to Firebase for further load
                            //var ref_places_push = new Firebase('https://luminous-torch-9364.firebaseio.com/web/users/' + $scope.facebookId + '/' + $scope.tripID + '/places');
                            //ref_places_push.set($scope.nearbyPlaces);
                        });
                        nearbyPlaces.on('iterateOverPathProgress', function (event, value) {
                            $scope.iterateOverPathProgress = value;
                        });
                        nearbyPlaces.on('iterateOverNearbyPlacesProgress', function (event, value) {
                            $scope.iterateOverNearbyPlacesProgress = value;
                        });
                        nearbyPlaces.init();
                        //////////////////////
                    }

                    $scope.clickOnRouteList = function (route) {
                        if ($scope.trip_created_manually) {
                            //show only the selected route
                        } else {
                            //Show only the route in the selected day
                            $scope.filter_trip_paths_by_day(route.routes[0].hash_index);
                        }
                    };

                    //disable / Enable routes / Routes List on map + List
                    $scope.routesOnMap = function (flag) {
                        if ($scope.trip_created_manually) {
                            if (flag) { //if true then show routes on map
                                //show routes on map
                                for (var i = 0; i < directionsDisplay.length; i++) {
                                    directionsDisplay[i].setMap($scope.map);
                                }
                                //enable flags (markers) this case on for manually - user adding flags when click on places he visited
                                $scope.trip_enable_all_markers();
                            } else {
                                //disable routes on map
                                for (var i = 0; i < directionsDisplay.length; i++) {
                                    directionsDisplay[i].setMap(null);
                                }
                                //disable flags (markers) this case on for manually - user adding flags when click on places he visited
                                $scope.trip_disable_all_markers();
                            }
                        } else {
                            if (flag) { //if true then show routes on map
                                $scope.trip_enable_all_paths();
                                //enable flags (markers) this case on for manually - user adding flags when click on places he visited
                                $scope.trip_enable_all_markers();
                            } else { //if false then disable routes on map
                                $scope.trip_disable_all_paths();
                                //disable flags (markers) this case on for manually - user adding flags when click on places he visited
                                $scope.trip_disable_all_markers();
                            }
                        }
                    };

                    //Disable / Enable Tips + Tips list on map
                    $scope.tipsOnMap = function (tips_flag) {
                        $scope.trip_disable_all_tips();
                        $scope.trip_disable_all_places();
                        /*
                         //if ($scope.trip_created_manually) {} // not relevant for tips
                         if (tips_flag) { //if True then the show tips in map and list //update, no need to delete from list
                         $scope.trip_enable_all_tips();
                         }else{ // if false then disable tips on map and list
                         $scope.trip_disable_all_tips();
                         }
                         */
                    };

                    $scope.placesOnMap = function (places_flag) {
                        $scope.trip_disable_all_places();
                        $scope.trip_disable_all_tips();
                        /*
                         if (places_flag) { //if True then the show places in map and list
                         $scope.trip_enable_all_places();
                         }else{ // if false then disable places on map and list
                         $scope.trip_disable_all_places();
                         }
                         */
                    };

                    /////////////////// ******* help function ********* /////////////////

                    //When user click on Tip from the list then show the info window
                    $scope.showTipInfoOnMap_List = function (tip) {
                        markers_tips[tip.id].info.open($scope.map, markers_tips[tip.id].marker);
                    }

                    //When user click on place from the list then show the info window
                    $scope.showPlaceInfoOnMap_List = function (place) {
                        markers_places[place.id].info.open($scope.map, markers_places[place.id].marker);
                    }
                    //Show Tip on map by click on item in the right panel
                    $scope.showTipOnMap = function (tip) {

                        console.log(tip);

                        // InfoWindow content
                        var content = '<table style="width: 100%;">' +
                            '<tr>' +
                            '<td class="block" >' + tip.category + '</td>' +
                            '<td class="block" >' + tip.text + '</td>' +
                            '</tr>' +
                            '</table>' +
                            '<div>' +
                            '</div>'

                        var id = markers_tips.length;

                        //Show on map by adding marker with info
                        var marker_tip = new google.maps.Marker({
                            position: new google.maps.LatLng(tip.location.coords.latitude, tip.location.coords.longitude),
                            map: $scope.map,
                            title: null,
                            icon: 'assets/icons/map_info_tip.png',
                            id: id,
                            clicked: false
                        });

                        var infowindow_message = new google.maps.InfoWindow({
                            content: content // place.name
                        });

                        marker_tip.addListener('click', function () {
                            console.log(marker_tip.id);
                            console.log(markers_tips.length);
                            if (marker_tip.id != null && marker_tip.id >= 0 && marker_tip.clicked == false) {
                                markers_tips[marker_tip.id].info.open($scope.map, marker_tip);
                                markers_tips[marker_tip.id].marker.clicked = true;
                            } else {
                                if (marker_tip.id != null && marker_tip.id >= 0 && marker_tip.clicked == true) {
                                    markers_tips[marker_tip.id].info.close();
                                    markers_tips[marker_tip.id].marker.clicked = false;
                                }
                            }
                        });

                        //infowindow_message.open($scope.map, marker_tip);
                        //save in array to to handle all places on map
                        markers_tips.push({marker: marker_tip, info: infowindow_message});
                    }

                    //Show place on map by click on item in the right panel
                    $scope.showPlaceOnMap = function (place) {
                        //console.log(place);

                        // InfoWindow content
                        var content = '<table style="width: 100%;">' +
                            '<tr>' +
                            '<td class="block">' +
                            '<img src=' + place.picture.data.url + ' height="50" width="50">' +
                            '</td>' +
                            '<td class="block" >' + place.name + '</td>' +
                            '<td class="block">| Checkins: ' + place.checkins + '</td>' +
                            '</tr>' +
                            '</table>' +
                            '<div>' +
                            '<a href=' + place.link + ' target="_blank">' + place.link + '</a>'
                        '</div>'

                        var id = markers_places.length;
                        //Show on map by adding marker with info
                        var marker_place = new google.maps.Marker({
                            position: new google.maps.LatLng(place.location.latitude, place.location.longitude),
                            map: $scope.map,
                            title: null,
                            icon: 'assets/icons/google-place-optimization-32.png',
                            id: id,
                            clicked: false
                        });

                        var infowindow_message = new google.maps.InfoWindow({
                            content: content // place.name
                        });

                        marker_place.addListener('click', function () {
                            console.log(marker_place.id);
                            console.log(markers_places.length);
                            if (marker_place.id != null && marker_place.id >= 0 && marker_place.clicked == false) {
                                markers_places[marker_place.id].info.open($scope.map, marker_place);
                                markers_places[marker_place.id].marker.clicked = true;
                            } else {
                                if (marker_place.id != null && marker_place.id >= 0 && marker_place.clicked == true) {
                                    markers_places[marker_place.id].info.close();
                                    markers_places[marker_place.id].marker.clicked = false;
                                }
                            }
                        });
                        //infowindow_message.open($scope.map, marker_place);

                        //save in array to to handle all places on map
                        markers_places.push({marker: marker_place, info: infowindow_message});
                    }

                // ************** Load Places from Firebase *********************

                    $scope.nearbyPlaces = [];
                    $scope.nearbyPlacesReady = true;

                    // ******* load places from firebase ****** Places saved the same if Automatic trip or Manually created
                    $scope.nearbyPlacesReady = true;

                    var firebase_places = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/map/places');
                    firebase_places.once("value", function (snapshot) {
                        snapshot.forEach(function (childSnapshot) {
                            if (childSnapshot.val() != '') {
                                var place = JSON.parse(childSnapshot.val());

                                var id = $scope.nearbyPlaces.length;
                                place.id = id;

                                $scope.nearbyPlaces.push(place);
                                //add place on map
                                // add_place_on_map(place);

                                //add marker without info about the place - else it will be busy
                                //let user click on a place then a pop up will be created in the right lat, lng
                                //Show on map by adding marker with info

                                $scope.showPlaceOnMap(place);

                            }
                        });
                    }, function (errorObject) {
                        console.log("Read Places from Firebase failed: " + errorObject.code);
                    });


                    //***** ########### Handle Routes ############### ************
                    //Read Routes from Firebase (Manually added places - it's different from recorded path) - Put on Map

                    $scope.routes_list = [];
                    var firebase_drawing_markers_routes = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/map/routes');
                    //firebase_drawing_markers_routes.push(JSON.stringify(response));

                    firebase_drawing_markers_routes.once("value", function (snapshot) {
                        //create direction Service and Display
                        var directionsService = new google.maps.DirectionsService;
                        //var directionsDisplay = new google.maps.DirectionsRenderer;

                        snapshot.forEach(function (childSnapshot) {
                            console.log('Trip:: Reading new route from firebase under /map/routes');

                            if (!childSnapshot.val().hasOwnProperty("separator")) { //ignore separator object
                                var route = JSON.parse(childSnapshot.val());
                                //For the list in right side
                                route.firebase_key = childSnapshot.key();
                                //console.log(route);
                                $scope.routes_list.unshift(route);

                                //for map
                                directionsDisplay.push(new google.maps.DirectionsRenderer({
                                    preserveViewport: false
                                }));
                                directionsDisplay[directionsDisplay.length - 1].setMap($scope.map); //last added directionDisplay
                                directionsDisplay[directionsDisplay.length - 1].setDirections(route);
                            }
                        });
                        $scope.$apply();
                    }, function (errorObject) {
                        console.log("Trip:: Read trip routes from Firebase failed: " + errorObject.code);
                    });


                //If no routes in Firebase then let's try to load from Recorded path
                // ********* Create routes from recorded path *****************
                // each day is a route in this case
                // simulate route data to keep the same structure for UI route.routes[0].summary

               // $scope.routes_settings = {enable_routes_map: true};

                for (var i = 0; i < $scope.trip_path_hash.length; i++) {
                    var routes = new Array(0);
                    if (i == 0) {
                        routes[0] = {summary: 'Route - All days', hash_index: i};
                    } else {
                        routes[0] = {summary: 'Route in day ' + i, hash_index: i};
                    }
                    // hash index will be the pointed to the hash table in case user click on route
                    var route = {routes: routes};
                    $scope.routes_list.push(route);
                }

///////////////////// $$$$$$$%%%%%%%%%%#^#$%#$%#$%#$%$#^#$^#$^#$^$ ///////////////////////////////////////
                    //if Trip was created automatic using the APP then load from places
                    //Get if trip was created manually, it means the trip was created manually by users and not using the recorder APP
                    var directionsDisplay = [];

                    var firebase_update_manually = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/_trip/trip_created_manually');
                    console.log('Wizard:: Firebase:: Reading trip meta data - Trip created manually?');
                    firebase_update_manually.once("value", function (snapshot) {
                        console.log('Trip:: Trip meta data:');
                        console.log('Trip:: Trip was created manually ::')
                        console.log(snapshot.val());
                        if (snapshot.val() == true) {
                            $scope.trip_created_manually = true;
                        } else {
                            $scope.trip_created_manually = false;
                        }

                        if ($scope.trip_created_manually) { //manually trip was uploaded

                            $scope.routes_settings = {enable_routes_map: true};

                        } else { //trip was created by mobile APP
                            //Google places
                            //$scope.loadNearByPlaces($scope.trip_path_hash);

                            // ****** Facebook places *********
                            /*
                             nearbyPlacesFacebook.runNerarbyPlaces($scope.trip_path_hash);
                             $scope.$on('facebook-places-ready', function (event, args) {

                             var placesByFacebook = nearbyPlacesFacebook.getNerarbyPlaces();

                             //prepare the array to fit places in UI
                             for (var i = 0; i < placesByFacebook.length; i++) {
                             if (placesByFacebook[i].data.length > 0) {
                             for (var j = 0; j < placesByFacebook[i].data.length; j++) {
                             if (placesByFacebook[j].data[j]) {
                             $scope.nearbyPlaces.push(placesByFacebook[i].data[j]);

                             //add place on map
                             add_place_on_map(placesByFacebook[i].data[j]);
                             }
                             }
                             }
                             }
                             });
                             */
                        }
                    }, function (errorObject) {
                        console.log("The read failed (Trip meta data): " + errorObject.code);
                    });

                    // ################### Handle Expense ##########################
                    $scope.expense_list = [];
                    var firebase_expense_load = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/expense');
                    firebase_expense_load.once("value", function (snapshot) {
                        snapshot.forEach(function (childSnapshot) {
                            var expense_item = childSnapshot.val();
                            expense_item.firebase_key = childSnapshot.key();
                            $scope.expense_list.push(expense_item);
                        })
                    });

///////////////////////////////////////////////////////////////////////////////////////


                    //load Table from Firebase
                    var firebase_ref_readTable = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/table');

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
                        console.log('Trip page:: add day');
                        console.log($scope.day);

                        var firebase_table = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + "/" + $scope.tripID + "/table/" + $scope.day.dayNumber);
                        firebase_table.set($scope.day);
                    }

                    $scope.addMessage = function () {
                        // add a new note to firebase
                        var message_json = {};

                        var firebase_tips = new Firebase("https://luminous-torch-9364.firebaseio.com/web/users/" + $scope.facebookId + '/' + $scope.tripID + '/messages');

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
                        } else {
                            z = google.maps.event.addListener(map, 'zoom_changed', function (event) {
                                google.maps.event.removeListener(z);
                                smoothZoom(map, max, cnt + 1);
                            });
                            setTimeout(function () {
                                map.setZoom(cnt)
                            }, 80); // 80ms is what I found to work well on my system -- it might not work well on all systems
                        }
                    }

                }
            );


        } else {
            //If no Trip Id from some reason then go back to Trips page
            $scope.noTripId = true;
            $state.go('trips');
        }
        //############End Main closure ###################### //

//*********************************************
//**************** Extra Help functions *******
//*********************************************
        var resizeImage = function (file) {
            // from an input element
            /*        var filesToUpload = input.files;
             var file = filesToUpload[0];

             var img = document.createElement("img");
             var reader = new FileReader();
             reader.onload = function(e) {img.src = e.target.result}*/
            var reader = new FileReader();
            reader.readAsDataURL(file);

            var img = document.createElement("img");
            var canvas = document.createElement('canvas');

            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            var MAX_WIDTH = 800;
            var MAX_HEIGHT = 600;
            var width = img.width;
            var height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            var dataurl = canvas.toDataURL("image/png");

        }

    })
    .
    directive('lightgallery', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                if (scope.$last) {
                    element.parent().lightGallery({
                        mode: 'lg-fade'
                    });


                }
            }
        };
    })
function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
/////////////////////// End Extra Help Functions /////////////////////////////////

////////////*************************** Code End Here ******************************//////////////////////