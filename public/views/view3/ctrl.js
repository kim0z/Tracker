trackerApp.controller('view3Ctrl', function ($scope, $http, googleMapsAPIService, $mdDialog, $mdSidenav, dataBaseService, messages) {
    //start
    /*
     (function() {
     'use strict';
     // Include app dependency on ngMaterial
     var app = angular.module('YourApp', ['ngMaterial']);

     //Config theme
     app.config(function($mdThemingProvider) {
     $mdThemingProvider.theme('blue')
     .primaryPalette('blue')
     .accentPalette('red');
     });
     */
    // Main Controller



    //Edit the current trip, get the trip id and send to planning page
    $scope.editTrip = function(id){
        console.log('Client:: Click Edit trip :: id:: '+ id);

        //now I have the id of the trip, I should open the planning page in edit mode
    }

    dataBaseService.getTrips().then(function (results) {
        $scope.trips = results.data;
        console.log('Client:: View3:: Fun run when load page :: list of trips: '+ $scope.trips.length);




        $scope.chunks = [{
            title: "Today",
            divider: true
        }, {
            title: "Dell's Life After Wall Street - NYTimes.com",
            description: "Dell is trying to graduate/evolve/pivot from PCs to lots of other products &amp; industries. Still being the backbone of the company, PC sales are financing the transition, but new products are supporting PC/server sales as well. Dell/the article don't give any numbers yet on how well (or not) those new categories are working. Increased risk for increased potential upside.",
            expanded: false,
            content: {
                type: "QUOTE",
                quotes: ["A year after spending $24.9 billion taking his computer company private", " Mr. Dell will try to persuade people that his company is about far more than the personal computers and computer servers it has been known for, with products intended for things as varied as the cloud computing networks of global enterprises and handy personal devices.", " a transformation(...)he actually started six years ago, spending $18 billion on 40 acquisitions", "The new Dell has software, equipment for data storage and computer networking, services and sensors. It is developing software that measures facial expressions, voice tone, even how we individually swipe key cards. There is a device that can make a hotel room’s digital television into a secure corporate computer. A Dell tablet is the world’s thinnest and lightest,(...)And, of course, there are lots of new personal computers.", " The question is: Can Dell ignite sales enough to become less reliant on the same old business?", "As a private firm, its deals move faster — exactly what Mr. Dell wanted. Last March, Dell bought Statsoft, a(...)maker of predictive analytic software.(...)it took two meetings with Mr. Dell lasting a total of two hours and 15 minutes. “In a public company, there would be at least one board meeting about this, maybe two, so that would be two quarters", "Dell had about 110,000 employees(...) and(...)now(...)90,000. It is unclear how many more cuts there will be.", " his three-quarter stake in Dell is a significant amount of his net worth, estimated at $16 billion"]
            }
        },{
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
        }];

        //create Json list of trips in the Client
        for ( var i = 3 ; i < $scope.trips.length ; i++)
        {
            var jsonTrip = {id:$scope.trips[i].id , title: $scope.trips[i].trip_name, description: $scope.trips[i].trip_description,
                expanded: false, content: {type: "QUOTE", quotes: ["quotedfdsgfdsgfdsfsdfsdfsdfdsfs"]}};
            $scope.chunks[i] = jsonTrip;
        }



    });


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
            console.log('Client:: View3:: Fun:: openTripPlanPage :: new empty trip record created');
            window.open ('#/view1', '_self', false)
        })


    };
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