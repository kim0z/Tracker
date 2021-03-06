/**
 * Created by karim on 02/10/2016.
 */
trackerApp.controller('newTripCtrl', function ($scope, $http, $state,  ngDialog, $q, $filter, googleMapsAPIService, dataBaseService, algorithmsService, flightAPIService, messages, NgTableParams, localStorageService) {
    "use strict";

    $scope.profile = localStorageService.get('profile');

    //get trip data to the page
    $scope.trip_id = messages.getTripID();

    $scope.continents = ["Africa", "Europe", "Asia", "North America", "South America", "Antarctica", "Australia"];

    if ($scope.trip_id == '') {
        console.log('error:: Client :: myTrips :: Trips :: no trip id');
        window.open('#/viewError', '_self', false);
    }

    $scope.facebookId = $scope.profile.identities[0].user_id;

    $scope.addTrip = function () {

        //save all the general information about the trip
        var jsonTripGeneralInfo = {
            email: $scope.profile.email,
            trip_id: messages.getTripID(), //internal use for updating
            trip_name: $scope.tripName,
            trip_description: $scope.tripDescription,
            start_date: $scope.dateStart,
            end_date: $scope.dateEnd,
            continent: $scope.selectedContinents,
            profile_picture: $scope.profile.picture,
            facebook_id: $scope.facebookId
        };

        //save updated trip into DB
        dataBaseService.updateTripGeneralInfo(jsonTripGeneralInfo)
            .success(function (data, status, headers, config) {
                //$scope.message = data; //handle data back from server - not needed meanwhile
                console.log(jsonTripGeneralInfo);
            })
            .error(function (data, status, headers, config) {
                console.log("failure message: " + JSON.stringify({data: data}));
            });

        $scope.closeThisDialog();

    };


    $scope.closeDialog = function () {
        //delete the empty trip that was created when the Add dialog was opened (it used to create template)
        //delete because the user canceled the trip he wanted to add

        if ($scope.trip_id == '') {
            console.log('error:: Client:: New Trip Dialog:: Cancel trip creation, no trip id');
        } else {

                var dataTripId = {trip_id: $scope.trip_id};
                dataBaseService.deleteTripById(dataTripId).then(function (results) {

                    console.log('Client:: New Trip Dialog:: Cancel trip creation :: Delete trip id:: ' + $scope.trip_id);
                    $scope.closeThisDialog();
                })

        }
    }

});
