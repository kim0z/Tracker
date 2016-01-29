'use strict';

// Declare app level module which depends on views, and components
var trackerApp = angular.module('myApp', [
    'nemLogging',
    'ui.router',
    'uiGmapgoogle-maps',
    'ngAutocomplete',
    'angularNumberPicker',
    '720kb.datepicker',
    'smart-table',
    'ngMaterial',
    'ngAnimate',
    'ngAria',
    'ngTable',
    'satellizer',
    'facebook'
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
            })
            .state('login', {
                url: "/login",
                templateUrl: "views/login/login.html",
                controller: 'login'
            });
    })
    .config([
        'FacebookProvider',
        function(FacebookProvider) {
            var myAppId = '942317529184852';

            // You can set appId with setApp method
            // FacebookProvider.setAppId('myAppId');

            /**
             * After setting appId you need to initialize the module.
             * You can pass the appId on the init method as a shortcut too.
             */
            FacebookProvider.init(myAppId);

        }
    ])
/*
    .config(['uiGmapGoogleMapApiProvider', function (GoogleMapApiProviders) {

        GoogleMapApiProviders.configure({
            china: true,
            libraries: 'geometry,visualization'
        });

    }])
*/
    .config(['uiGmapGoogleMapApiProvider', function (GoogleMapApi) {
        GoogleMapApi.configure({
            //    key: 'your api key',
            v: '3.17',
            libraries: 'weather,geometry,visualization'
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
            case 'Login':
                window.open ('#/login', '_self', false);
                break;
            default: window.open ('#/login', '_self', false);
        }

    };
});
