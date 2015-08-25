trackerApp.controller('view1Ctrl',function($scope, $http, googleMapsAPIService, dataBaseSerivce) {

		//get last trip id from server
		dataBaseSerivce.getLastTripId()
		.success(function(data, status, headers, config) {
			//$scope.message = data; //handle data back from server - not needed meanwhile
				$scope.lastTripId = data;
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




//////// set valuse for the trip ////////////////////

	$scope.tripName = {
        text: 'Trip Name 1',
        word: /^\s*\w*\s*$/
    };
    $scope.dateStart = {
    	text: ''
    };
    $scope.dateEnd = {
    	text: ''
    };


    $scope.onBlur = function(dest) {

		console.log(event.target.name);
		//console.log(angular.toJson(dest));

    	//create Json with trip id, name, dates
    	var jsonTripData = {};
    	var jsonTripCities = {};
    	var jsonTrip = {};
    	//if(event.target.name == 'inputTripName' || event.target.name == 'inputStartDate' || event.target.name == 'inputEndDate'  )
    //	{
    		jsonTripData = {general: {trip_name: $scope.tripName.text, start_date: $scope.dateStart.text, end_date: $scope.dateEnd.text}};
    		console.log(jsonTripData);
    	//}
    	//else {//if(event.target.name == 'inputDest'){
 
    		//get GeoLocation to the city
    		/*
    		googleMapsAPIService.getGeoCode(dest)
				.success(function(data, status, headers, config) {
				//$scope.message = data; //handle data back from server - not needed meanwhile
					console.log(data);
				})
				.error(function(data, status, headers, config) {
					alert( "failure message: " + JSON.stringify({data: data}));
				});	
*/
		//get the destination number from the laber text destination1 = 1, detination2 = 2
		var r = /\d+/;
		var s = event.target.name;
		var cityNumber = s.match(r);

		//save all destination to json file
		for(var i = 0; i < $scope.destinations.length ; i++){
			jsonTripCities[i] = $scope.destinations[i].city;
		}

		//create the full trip json {trip_id: 2, jsonTripData, jsonTripCities}
		console.log("here"+ $scope.lastTripId);
		jsonTrip['trip_id'] = $scope.lastTripId + 1;
		jsonTrip['general'] = jsonTripData;
		jsonTrip['cities'] = jsonTripCities;
		
		//}


		//save the cities list to data base
		dataBaseSerivce.saveTrip(jsonTrip)
			.success(function(data, status, headers, config) {
				//$scope.message = data; //handle data back from server - not needed meanwhile
					console.log(jsonTrip);
				})
				.error(function(data, status, headers, config) {
					alert( "failure message: " + JSON.stringify({data: data}));
			});	


    };
});