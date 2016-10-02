/**
 * Created by karim on 02/10/2016.
 */
trackerApp.controller('newTripCtrl', function ($scope, $http, ngDialog, $q, $filter, googleMapsAPIService, dataBaseService, algorithmsService, flightAPIService, messages, NgTableParams, localStorageService) {
    "use strict";
    alert('New Trip Ctrl');

    $scope.profile = localStorageService.get('profile');

    //get trip data to the page
    $scope.trip_id = messages.getTripID();

    $scope.continents = ["Africa", "Europe", "Asia", "North America", "South America", "Antarctica", "Australia"];

    if ($scope.trip_id == '') {
        window.open('#/viewError', '_self', false);
    }

    $scope.addTrip = function () {

        //save all the general information about the trip
        var jsonTripGeneralInfo = {
            email: $scope.profile.email,
            trip_id: messages.getTripID(), //internal use for updating
            trip_name: $scope.tripName,
            trip_description: $scope.tripDescription,
            start_date: $scope.dateStart,
            end_date: $scope.dateEnd,
            continent: 'America'
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


    }

});
