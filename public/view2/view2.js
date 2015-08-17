'use strict';

angular.module('myApp.view2', ['ngRoute','uiGmapgoogle-maps'])

.config(['$routeProvider','uiGmapGoogleMapApiProvider', function($routeProvider,GoogleMapApiProviders) {
  $routeProvider.when('/view2', {
    templateUrl: 'view2/view2.html',
    controller: 'View1Ctrl'
  });
   GoogleMapApiProviders.configure({
            china: true
        });
}])

.controller('View2Ctrl', function($scope) {
		$scope.map = {
			center: {
			latitude: 37.79,
			longitude: -122.4175
		},
		zoom: 13
		};
});