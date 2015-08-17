'use strict';

var app = angular.module('myApp.view1', ['ngRoute','uiGmapgoogle-maps'])

.config(['$routeProvider','uiGmapGoogleMapApiProvider', function($routeProvider,GoogleMapApiProviders) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl',
	controller: 'ExampleController'
	
  });
   GoogleMapApiProviders.configure({
            china: true
        });
}])

app.controller('View1Ctrl', function($scope) {
		$scope.map = {
			center: {
			latitude: 37.79,
			longitude: -122.4175
		},
		zoom: 13
		};
});


			
			
app.controller('ExampleController', ['$scope', '$http', function($scope, $http) {

    $scope.submit = function() {
				var dataObj = {name: $scope.formData.name, email: $scope.formData.email, messeage: $scope.formData.message};
        //if ($scope.text) {
				var res = $http.post('/postTrip', dataObj);
				res.success(function(data, status, headers, config) {
				//$scope.message = data; //handle data back from server - not needed meanwhile
				});
				res.error(function(data, status, headers, config) {
					//alert( "failure message: " + JSON.stringify({data: data}));
				});		
				// Making the fields empty
				//
				$scope.name='';
				$scope.email='';
				$scope.message='';
       // }
      };
    }]);
			
			