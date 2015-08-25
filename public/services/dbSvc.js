trackerApp.service('dataBaseSerivce', ['$http', function($http) {

	this.saveTrip = function(dataObj) {
		console.log('database service');
		return $http.post('/saveTrip', dataObj);
	};

	this.getLastTripId = function() {
		return $http.post('/getLastTripId');
	};
	
	
}]);