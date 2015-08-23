'use strict';

// Declare app level module which depends on views, and components
var trackerApp = angular.module('myApp', [
  'ui.router',
  'uiGmapgoogle-maps',
  'angularNumberPicker',
  '720kb.datepicker'
])
.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/");
  //
  // Now set up the states
  $stateProvider
    .state('view1', {
      url: "/",
      templateUrl: "views/view1/view1.html",
      controller: 'view1Ctrl'
    })
    .state('view2', {
      url: "/view2",
      templateUrl: "views/view2/view2.html",
      controller: 'view2Ctrl'
    });
})

.config(['uiGmapGoogleMapApiProvider', function(GoogleMapApiProviders) {

	GoogleMapApiProviders.configure({
        china: true
    });

}]);