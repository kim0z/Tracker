trackerApp.service('dataBaseSerivce', ['$http', function($http) {

	this.saveCities = function(dataObj) {
		return $http.post('/saveCities', dataObj);
	};

	this.getLastTripId = function() {
		return $http.post('/getLastTripId');
	};
	
	
}]);