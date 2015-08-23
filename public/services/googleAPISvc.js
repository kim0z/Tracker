trackerApp.service('googleMapsAPIService', ['$http', function($http) {

	this.getGeoCode = function(dataObj) {
		return $http.post('/getGeoCode', dataObj);
	};


	
}]);