'use strict';

// Declare app level module which depends on views, and components
var trackerApp = angular.module('myApp', [
    'nemLogging',
    'ui.router',
    'uiGmapgoogle-maps',
    'angularNumberPicker',
    '720kb.datepicker',
    'smart-table',
    'ngMaterial',
    'ngAnimate',
    'ngAria',
    'ngTable'
])
    .config(function ($stateProvider, $urlRouterProvider) {
        //
        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/");
        //
        // Now set up the states
        $stateProvider
            .state('view0', {
                url: "/view0",
                templateUrl: "views/view0/view0.html",
                controller: 'view0Ctrl'
            })
            .state('view1', {
                url: "/view1",
                templateUrl: "views/view1/view1.html",
                controller: 'view1Ctrl'
            })
            .state('view2', {
                url: "/view2",
                templateUrl: "views/view2/view2.html",
                controller: 'view2Ctrl'
            })
            .state('view3', {
                url: "/view3",
                templateUrl: "views/view3/view3.html",
                controller: 'view3Ctrl'
            })
            .state('viewError', {
                url: "/viewError",
                templateUrl: "views/viewError/404.html",
                controller: 'viewErrorCtrl'
            });
    })

    .config(['uiGmapGoogleMapApiProvider', function (GoogleMapApiProviders) {

        GoogleMapApiProviders.configure({
            china: true
        });

    }])

    .config(function($mdThemingProvider) {
        $mdThemingProvider.theme('blue')
            .primaryPalette('blue')
            .accentPalette('red');
    });


trackerApp.controller('mainIndexCtrl', function ($scope) {
    $scope.menuClick = function (buttonText) {
        switch(buttonText) {
            case 'Home':
                window.open ('#/view0', '_self', false);
                break;
            case 'My Trips':
                window.open ('#/view3', '_self', false);
                break;
            case 'Plan Trip':
                window.open ('#/view1', '_self', false);
                break;
            case 'Rel-Time Travelers':
                window.open ('#/view2', '_self', false);
                break;
            default: window.open ('#/view0', '_self', false);
        }

    };
});
