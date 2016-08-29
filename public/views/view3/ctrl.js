trackerApp.controller('view3Ctrl', function ($scope, $http, $window, googleMapsAPIService, $mdDialog, $mdSidenav, dataBaseService, messages, localStorageService) {



    $scope.profile = localStorageService.get('profile');

    $scope.toggleChunkExpand = function(chunk) {
        chunk.expanded = !chunk.expanded;
        if (chunk.expanded) {
            getCoverPhoto(chunk);
        }
    }


/*    function getCoverPhoto(chunk) {
        //get cover photo named profile in AWS S3 under the user folder - BLOCKED, instead using config from Firebase (Facebook album cover)
        //AWS Config
        AWS.config.credentials = new AWS.Credentials('AKIAIGEOPTU4KRW6GK6Q', 'VERZVs+/nd56Z+/Qxy1mzEqqBwUS1l9D4YbqmPoO');
        // Configure your region
        AWS.config.region = 'us-west-2';
        // below AWS S3 code used to get photos and show in offline page
        var S3URL = 'https://s3-us-west-2.amazonaws.com/';
        var bucket = new AWS.S3({
            params: {
                Bucket: 'tracker.photos',
                //Marker: localStorageService.get('email') + '/' + chunk.id
                Delimiter: '/',
                Prefix: localStorageService.get('email') + '/' + chunk.id + '/'
            }
        });


        bucket.listObjects(function (err, data) {
            var i;
            if (err) {
                console.dir(err);
            } else {
                for (i = 0; i < data.Contents.length; i++) {

                    var substring = "cover";
                    // console.log(S3URL + 'tracker.photos/' + data.Contents[i].Key)
                    if (data.Contents[i].Key.indexOf(substring) > -1) {
                        break;
                       // return S3URL + 'tracker.photos/' + data.Contents[i].Key;
                    }
                }
                chunk.coverPhotoUrl = i < data.Contents.length ? S3URL + 'tracker.photos/' + data.Contents[i].Key : '';
            }
        });

    }*/

    function getCoverPhoto(chunk) {

        //this funxtion should be loaded when the page is loaded, not when click on
        var firebase_config = new Firebase("https://trackerconfig.firebaseio.com/web/tripslist/coverphoto/trip/"+chunk.id);

        // Attach an asynchronous callback to read the data at our posts reference
        firebase_config.on("value", function(snapshot) {
            console.log(snapshot.val());
            chunk.coverPhotoUrl = snapshot.val();
            $scope.$apply();
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });

    }
    //Open actual map for the trip (the map after the trip was executed), this functionality should be available when the trip end date < current date
    $scope.showActualMap = function(trip_id) {
        console.log('Client:: Click Shoe actual map - trip :: id:: ' + trip_id);
        messages.saveTripID(trip_id); //save trip id into message
        window.open('#/offlinemap', '_self', false);
    }
    /*
 should be deleted added by wrong
     $scope.chunk = function (trip_id) {
        console.log('Client:: Click Shoe actual map - trip :: id:: ' + trip_id);
        messages.saveTripID(trip_id); //save trip id into message
        window.open('#/offlinemap', '_self', false);
    }
    */

    //Edit the current trip, get the trip id and send to planning page
    $scope.editTrip = function (trip_id) {
        console.log('Client:: Click Edit trip :: id:: ' + trip_id);
        messages.saveTripID(trip_id); //save trip id into message
        window.open('#/view1', '_self', false);
    }

    $scope.deleteTrip = function (trip_id) {
        dataTripId = {trip_id: trip_id};
        dataBaseService.deleteTripById(dataTripId).then(function (results) {
            //$scope.message = data; //handle data back from server - not needed meanwhile
            console.log('Client:: View3:: Fun:: openTripPlanPage :: Delete trip id:: ' + trip_id);
            $window.location.reload();
            //$route.reload();
        })
    }

    //when click on create new test 'the red circule button'
    $scope.openTripPlanPage = function ($event) {
        //create new record, get the id and move to the planning page, and behave like editing
        //1. push empty new record to trips table
        //2. get the id of the trip
        //3. save the trip id into messages service
        //4. make sure the planning page open the message and update the record

        //callback
        dataBaseService.createNewTripRecord().then(function (results) {
            //$scope.message = data; //handle data back from server - not needed meanwhile
            console.log('Client:: View3:: Fun:: openTripPlanPage :: new empty trip record created with id:: ' + results.data);


            messages.saveTripID(results.data);
            /*
             //create bucket in AWS S3 with email + trip id
             //AWS Config

             AWS.config.credentials = new AWS.Credentials('AKIAIGEOPTU4KRW6GK6Q', 'VERZVs+/nd56Z+/Qxy1mzEqqBwUS1l9D4YbqmPoO');

             // Configure your region
             AWS.config.region = 'us-west-2';

             // below AWS S3 code used to get photos and show in offline page
             var S3URL = 'https://s3-us-west-2.amazonaws.com/';

             var bucket = new AWS.S3({params: {Bucket: 'tracker.photos'}});

             bucket.createBucket(function() {
             var params = {Key: 'myKey2', Body: 'Hello!'};
             bucket.upload(params, function(err, data) {
             if (err) {
             console.log("Error uploading data: ", err);
             } else {
             console.log("Successfully uploaded data to myBucket/myKey");
             }
             });
             });*/

            window.open('#/view1', '_self', false)
        })
    };


    dataBaseService.getTrips({email: $scope.profile.email}).then(function (results) {
        $scope.trips = results.data;
        console.log('Client:: View3:: Fun run when load page :: list of trips: ' + $scope.trips.length);


        $scope.chunks = [];
        $scope.chunks_future = [{
            title: "Future",
            divider: true
        }, {
            title: "Dell's Life After Wall Street - NYTimes.com",
            description: "Dell is trying to graduate/evolve/pivot from PCs to lots of other products &amp; industries. Still being the backbone of the company, PC sales are financing the transition, but new products are supporting PC/server sales as well. Dell/the article don't give any numbers yet on how well (or not) those new categories are working. Increased risk for increased potential upside.",
            expanded: false,
            content: {
                type: "QUOTE",
                quotes: ["A year after spending $24.9 billion taking his computer company private", " Mr. Dell will try to persuade people that his company is about far more than the personal computers and computer servers it has been known for, with products intended for things as varied as the cloud computing networks of global enterprises and handy personal devices.", " a transformation(...)he actually started six years ago, spending $18 billion on 40 acquisitions", "The new Dell has software, equipment for data storage and computer networking, services and sensors. It is developing software that measures facial expressions, voice tone, even how we individually swipe key cards. There is a device that can make a hotel room’s digital television into a secure corporate computer. A Dell tablet is the world’s thinnest and lightest,(...)And, of course, there are lots of new personal computers.", " The question is: Can Dell ignite sales enough to become less reliant on the same old business?", "As a private firm, its deals move faster — exactly what Mr. Dell wanted. Last March, Dell bought Statsoft, a(...)maker of predictive analytic software.(...)it took two meetings with Mr. Dell lasting a total of two hours and 15 minutes. “In a public company, there would be at least one board meeting about this, maybe two, so that would be two quarters", "Dell had about 110,000 employees(...) and(...)now(...)90,000. It is unclear how many more cuts there will be.", " his three-quarter stake in Dell is a significant amount of his net worth, estimated at $16 billion"]
            }
        } /*,{
         title: "Yesterday",
         divider: true
         }, {
         title: "UBS CIO: Blockchain Technology Can Massively Simplify Banking - Digits - WSJ",
         description: "Lorem Ipsum Dolor Set Shalalala",
         expanded: false,
         content: {
         type: "QUOTE",
         quotes: ["And he saw that it was good"]
         }
         }, {
         title: "This week",
         divider: true
         }, {
         title: "And even another Something",
         description: "Lorem Ipsum Dolor Set Shalalala",
         expanded: false,
         content: {
         type: "QUOTE",
         quotes: ["And he saw that it was good"]
         }
         } */];

        $scope.chunks_history = [{
            title: "History",
            divider: true
        }, {
            title: "Dell's Life After Wall Street - NYTimes.com",
            description: "Dell is trying to graduate/evolve/pivot from PCs to lots of other products &amp; industries. Still being the backbone of the company, PC sales are financing the transition, but new products are supporting PC/server sales as well. Dell/the article don't give any numbers yet on how well (or not) those new categories are working. Increased risk for increased potential upside.",
            expanded: false,
            content: {
                type: "QUOTE",
                quotes: ["A year after spending $24.9 billion taking his computer company private", " Mr. Dell will try to persuade people that his company is about far more than the personal computers and computer servers it has been known for, with products intended for things as varied as the cloud computing networks of global enterprises and handy personal devices.", " a transformation(...)he actually started six years ago, spending $18 billion on 40 acquisitions", "The new Dell has software, equipment for data storage and computer networking, services and sensors. It is developing software that measures facial expressions, voice tone, even how we individually swipe key cards. There is a device that can make a hotel room’s digital television into a secure corporate computer. A Dell tablet is the world’s thinnest and lightest,(...)And, of course, there are lots of new personal computers.", " The question is: Can Dell ignite sales enough to become less reliant on the same old business?", "As a private firm, its deals move faster — exactly what Mr. Dell wanted. Last March, Dell bought Statsoft, a(...)maker of predictive analytic software.(...)it took two meetings with Mr. Dell lasting a total of two hours and 15 minutes. “In a public company, there would be at least one board meeting about this, maybe two, so that would be two quarters", "Dell had about 110,000 employees(...) and(...)now(...)90,000. It is unclear how many more cuts there will be.", " his three-quarter stake in Dell is a significant amount of his net worth, estimated at $16 billion"]
            }
        } /*,{
         title: "Yesterday",
         divider: true
         }, {
         title: "UBS CIO: Blockchain Technology Can Massively Simplify Banking - Digits - WSJ",
         description: "Lorem Ipsum Dolor Set Shalalala",
         expanded: false,
         content: {
         type: "QUOTE",
         quotes: ["And he saw that it was good"]
         }
         }, {
         title: "This week",
         divider: true
         }, {
         title: "And even another Something",
         description: "Lorem Ipsum Dolor Set Shalalala",
         expanded: false,
         content: {
         type: "QUOTE",
         quotes: ["And he saw that it was good"]
         }
         } */];

        //create JSON list of trips in the Client
        for (var i = 0; i < $scope.trips.length; i++) {
            var jsonTrip = {
                id: $scope.trips[i].id, title: $scope.trips[i].trip_name, description: $scope.trips[i].trip_description,
                expanded: false, content: {type: "QUOTE", quotes: ["quotedfdsgfdsgfdsfsdfsdfsdfdsfs"]}
            };

            if (new Date($scope.trips[i].end_date) > new Date()) {
                $scope.chunks_future.push(jsonTrip);
            } else {
                $scope.chunks_history.push(jsonTrip);
            }
            var chunks = $scope.chunks_future.concat($scope.chunks_history);
            $scope.chunks = chunks;
        }
    });

    $scope.openDialog = function ($event) {
        $mdDialog.show({
            targetEvent: $event,
            template: '<md-dialog>' +
            '  <md-content>Hello {{ userName }}!</md-content>' +
            '  <div class="md-actions">' +
            '    <md-button ng-click="closeDialog()">' +
            '      Close' +
            '    </md-button>' +
            '  </div>' +
            '</md-dialog>',
            controller: 'DialogController',
            onComplete: afterShowAnimation,
            locals: {
                name: 'Bobby'
            }
        });
        // When the 'enter' animation finishes...
        function afterShowAnimation(scope, element, options) {
            // post-show code here: DOM element focus, etc.
        }
    };

    $scope.toggleMenu = function () {
        $mdSidenav('left').toggle();
    };


    ///// here


    $scope.items = [{
        name: 'Share',
        icon: 'share'
    }, {
        name: 'Upload',
        icon: 'upload'
    }, {
        name: 'Copy',
        icon: 'copy'
    }, {
        name: 'Print this page',
        icon: 'print'
    },];

    $scope.listItemClick = function ($index) {
        var clickedItem = $scope.items[$index];
    };
    //    }]);


    /*

     // Dialog Controller
     app.controller('DialogController', function($scope, $mdDialog, name) {
     $scope.userName = name;
     $scope.closeDialog = function() {
     $mdDialog.hide();
     };
     });
     // Left Sidebar Controller
     app.controller('LeftCtrl', function($scope, $timeout, $mdSidenav) {
     $scope.close = function() {
     $mdSidenav('left').close();
     };
     });

     */


    // })();


    //end
});
//});