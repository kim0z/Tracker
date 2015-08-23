trackerApp.controller('view1Ctrl',function($scope, $http, googleMapsAPIService) {

	$scope.destinations = [
		{
			city: ""
		}
	];

	$scope.addNewDestination = function() {
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

    	googleMapsAPIService.getGeoCode(dest)
			.success(function(data, status, headers, config) {
			//$scope.message = data; //handle data back from server - not needed meanwhile
				console.log(data);
			})
			.error(function(data, status, headers, config) {
				//alert( "failure message: " + JSON.stringify({data: data}));
			});	

    };
});