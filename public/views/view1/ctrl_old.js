
var app = angular.module('myApp.view1', ['ngRoute','uiGmapgoogle-maps','angularNumberPicker','720kb.datepicker'])

.config(['$routeProvider','uiGmapGoogleMapApiProvider', function($routeProvider,GoogleMapApiProviders) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl',
	controller: 'ExampleController',
	controller: 'NumberPicker',
	controller: 'date',
	controller: 'View1Ctrl'
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


//submit
app.controller('ExampleController', ['$scope', '$http', function($scope, $http) {

    $scope.submit = function() {
				var dataObj = {name: $scope.formData.name, email: $scope.formData.email, message: $scope.formData.message};
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
			
//cities and trip definition 			
 app.controller('tripDefinitionCtrl', ['$scope','$http', function($scope, $http) {
    $scope.tripName = {
        text: 'Trip Name 1',
        word: /^\s*\w*\s*$/
    };

    $scope.onBlur = function($event) {

    	var dataObj = {city: $scope.destination1.text};
    	console.log($scope.destination1.text);

        		var res = $http.post('/getGeoCode', dataObj);
				res.success(function(data, status, headers, config) {
				//$scope.message = data; //handle data back from server - not needed meanwhile
					console.log(data);
				});
				res.error(function(data, status, headers, config) {
					//alert( "failure message: " + JSON.stringify({data: data}));
				});	


    }


 }]);

 //Number picker controller
app.controller('NumberPicker', ['$scope', function($scope) {
   $scope.input = {
            num: 0
        };

   $scope.getNumber = function() {
       alert('The number is: [' + $scope.input.num + ']');
   };

   $scope.onChange = function(){
       console.log('The number is Changed ', $scope.input.num);
   };
}]);

