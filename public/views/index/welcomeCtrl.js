trackerApp.controller('welcomeCtrl', function ($scope, $state, $mdDialog, dataBaseService, localStorageService) {


    $scope.openApp = function(){

        window.open('#/trips', '_self', false);

    };

    $scope.goToAgreement = function () {
        $state.go('agreement');
    }

    $scope.goToPrivacyPolicy = function () {
        $state.go('privacy');
    }


    $scope.showAlert = function(ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        // Modal dialogs should fully cover application
        // to prevent interaction outside of dialog
        $mdDialog.show(
            $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title('Coming soon')
                .content('iOS and Android app will be available in the market very soon to help you in recording your trips in real-time.')
                .ariaLabel('GreatBear')
                .ok('Got it!')
                .targetEvent(ev)
        );
    };


    var i = 0;
//dcfzra40jo7ha.cloudfront.net
    //http://dcfzra40jo7ha.cloudfront.net/videos/
    //videoSource[0] = 'assets/videos/greatbear_alaska_sea.mp4';
    var videoSource = new Array();
    videoSource[0] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_alaska_sea_720.mp4';
    videoSource[1] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_alaska_fall_720.mp4';
    videoSource[2] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_alaska_boat_720.mp4';
    videoSource[3] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_alaska_glacier_720.mp4';
    videoSource[4] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_iceland_gayzer_720.mp4';
    videoSource[5] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_iceland_dayanotherday_720.mp4';
    videoSource[6] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_icelnad_waterfall_720.mp4';
    var videoCount = videoSource.length;

    document.getElementById('video').addEventListener('ended', myHandler, false);
    document.getElementById("video").setAttribute("src", videoSource[0]);

    function myHandler() {

        i++;
        if (i == videoCount)
            i = 0;
        videoPlay(i);
    }

    function videoPlay(videoNum) {
        document.getElementById("video").setAttribute("src", videoSource[videoNum]);
        document.getElementById("video").load();
        document.getElementById("video").playbackRate = 0.7;
        var playPromise = document.getElementById("video").play();

        if(playPromise !== undefined) {
            playPromise.then({

            })
            .catch({})
        }
    }


    //Create new trip using wizard
    $scope.startWizard = function () {
        //create new empty trup, in this phase the id returned as a result
        dataBaseService.createNewTripRecord().then(function (results) {
            console.log('Client:: Welcome page:: Fun:: start wizard :: new empty trip record created with id:: ' + results.data);
            $state.go('wizard', {tripId: results.data});
        })
    }

    //Tooltips
    $scope.demo = {
        showTooltip: false,
        tipDirection: 'bottom'
    };

    $scope.demo.delayTooltip = undefined;
    $scope.$watch('demo.delayTooltip', function(val) {
        $scope.demo.delayTooltip = parseInt(val, 10) || 0;
    });

    // Carousel
    $scope.title = 'Here is the carousel demo';
  
    $scope.slides = [
      {
        title: "1 title",
        image: 'http://lorempixel.com/560/400/sports/1', 
      },
      {
        title: "2 title",
        image: 'http://lorempixel.com/560/400/sports/2', 
      },
      {
        title: "3 title",
        image: 'http://lorempixel.com/560/400/sports/3', 
      },
      {
        title: "4 title",
        image: 'http://lorempixel.com/560/400/sports/4',
      },
      {
        title: "5 title",
        image: 'http://lorempixel.com/560/400/sports/5', 
      },
    ];
  
  $scope.onCarouselInit = function() {
    console.log('carousel init');
  }
  


   $scope.showActualMap = function (trip_id) {
        console.log('Client:: Click Shoe actual map - trip :: id:: ' + trip_id);
        messages.saveTripID(trip_id); //save trip id into message, NOT needed any more, now using localstorage instead
        localStorageService.set('tripId', trip_id);
        window.open('#/trip/'+trip_id, '_self', false);
    }

// Get Trips to show it in Carousel 
dataBaseService.getPublicTrips({email: ''}).then(function (results) {
        $scope.trips = results.data;
        console.log('Client:: Welocme page:: list of trips to be shown in carousel: ' + $scope.trips.length + 'Trips');


        $scope.chunks = [];
        $scope.chunks_future = [];

        $scope.chunks_history = [];

        //create JSON list of trips in the Client
        for (var i = 0; i < $scope.trips.length; i++) {

            var continent = '';
            if ($scope.trips[i].continent != null) {
                continent = $scope.trips[i].continent[0];
                //console.log(continent);
            }

            var time_diff = Math.abs(new Date($scope.trips[i].end_date) - new Date($scope.trips[i].start_date));
            var trip_days = Math.ceil(time_diff / (1000 * 3600 * 24));

            var jsonTrip = {
                id: $scope.trips[i].id,
                title: $scope.trips[i].trip_name,
                description: $scope.trips[i].trip_description,
                track_mode: $scope.trips[i].track_mode,
                expanded: false,
                content: {type: "QUOTE", quotes: ["A great trip to .."]},
                active: $scope.trips[i].active,
                public: $scope.trips[i].public,
                continent: continent,
                picture: $scope.trips[i].picture,
                //cover:  getCoverPhoto($scope.trips[i].facebook_id, $scope.trips[i].id)
                //http://tracker.photos.s3-website-us-west-2.amazonaws.com/400x400/102211533498839/417/cover
                cover: 'http://tracker.photos.s3-website-us-west-2.amazonaws.com/335x235/'+ $scope.trips[i].facebook_id +'/'+ $scope.trips[i].id +'/cover',
                days: trip_days
            };

            //if (new Date($scope.trips[i].end_date) > new Date()) {
            //$scope.chunks_future.push(jsonTrip);
            //} else {
            $scope.chunks_history.push(jsonTrip);
            //}
            var chunks = $scope.chunks_future.concat($scope.chunks_history);
            $scope.chunks = chunks;
        }
    });

});


