trackerApp.controller('view1Ctrl',function($scope, $http, googleMapsAPIService, dataBaseSerivce) {

		dataBaseSerivce.getLastTripId()
		.success(function(data, status, headers, config) {
			//$scope.message = data; //handle data back from server - not needed meanwhile
			$scope.lastTripId = data;
				console.log(data);
			})
			.error(function(data, status, headers, config) {
				alert( "failure message getLastTripId: " + JSON.stringify({data: data}));
			});



	$scope.destinations = [
		{
			city: ""
		}
	];

	$scope.addNewDestination = function(dest) {
		$scope.destinations.push({
			city: ""
		});
	};

	$scope.map = {
		center: {
		latitude: 37.79,
		longitude: -122.4175
	},
	zoom: 13
	};


	$scope.tripName = {
        text: 'Trip Name 1',
        word: /^\s*\w*\s*$/
    };

    $scope.onBlur = function(dest) {

    	//console.log(event.target.value);
    	//get GeoLocation to the city
    	googleMapsAPIService.getGeoCode(dest)
			.success(function(data, status, headers, config) {
			//$scope.message = data; //handle data back from server - not needed meanwhile
				console.log(data);
			})
			.error(function(data, status, headers, config) {
				alert( "failure message: " + JSON.stringify({data: data}));
			});	


			//save the cities list to data base
		dataBaseSerivce.saveCities($scope.destinations)
		.success(function(data, status, headers, config) {
			//$scope.message = data; //handle data back from server - not needed meanwhile
				console.log(data);
			})
			.error(function(data, status, headers, config) {
				alert( "failure message: " + JSON.stringify({data: data}));
			});	
		


    };
});