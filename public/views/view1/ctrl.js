trackerApp.controller('view1Ctrl',function($scope, $http, googleMapsAPIService, dataBaseSerivce) {

		//get last trip id from server
		dataBaseSerivce.getLastTripId()
		.success(function(data, status, headers, config) {
			//$scope.message = data; //handle data back from server - not needed meanwhile
			$scope.lastTripId = data;
				console.log(data);
			})
			.error(function(data, status, headers, config) {
				alert( "failure message getLastTripId: " + JSON.stringify({data: data}));
			});


//Google maps section
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

 $scope.map = {center: {latitude: 44, longitude: -108 }, zoom: 4 };
        $scope.options = {scrollwheel: false};
        $scope.circles = [
            {
                id: 1,
                center: {
                    latitude: 44,
                    longitude: -108
                },
                radius: 100000,
                stroke: {
                    color: '#08B21F',
                    weight: 2,
                    opacity: 1
                },
                fill: {
                    color: '#08B21F',
                    opacity: 0.5
                },
                geodesic: true, // optional: defaults to false
                draggable: true, // optional: defaults to false
                clickable: true, // optional: defaults to true
                editable: true, // optional: defaults to false
                visible: true, // optional: defaults to true
                control: {}
            }
            ];




//////// google maps section end ////////////////////

	$scope.tripName = {
        text: 'Trip Name 1',
        word: /^\s*\w*\s*$/
    };


// trip name, dates out of focus event
$scope.onBlur = function(dest) {

    	//create Json with trip id, name, dates
    	//jsonTripData = {"trip_id": $scope.lastTripId + 1, general: {trip_name:, start_date:, end_date:}};
    	alert('out of f');
};




    $scope.onBlur = function(dest) {

console.log(event.target.name);

    	//create Json with trip id, name, dates
    	var jsonTripData = {};
    	if(event.target.name == 'inputTripName' || event.target.name == 'inputStartDate' || event.target.name == 'inputEndDate'  )
    	{

    			console.log($scope.tripName.text);
    	}
    	else if(event.target.name == 'inputDest'){
 
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
		
		}

    };
});