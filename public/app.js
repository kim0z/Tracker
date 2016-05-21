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
        'facebook',
        'LocalStorageModule',
        'firebase'
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
            })
            .state('offlinemap', {
                url: "/offlinemap",
                templateUrl: "views/offlinemap/offlinemap.html",
                controller: 'offlinemapCtrl'
            });
    })
    .config([
        'FacebookProvider',
        function (FacebookProvider) {
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

    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('blue')
            .primaryPalette('blue')
            .accentPalette('red');
    })

    //change from local storage to session storage
    .config(function (localStorageServiceProvider) {
        localStorageServiceProvider
            .setStorageType('sessionStorage');
    });

trackerApp.controller('mainIndexCtrl', function ($scope) {
    $scope.menuClick = function (buttonText) {
        switch (buttonText) {
            case 'Home':
                window.open('#/view0', '_self', false);
                break;
            case 'My Trips':
                window.open('#/view3', '_self', false);
                break;
            case 'Plan Trip':
                window.open('#/view1', '_self', false);
                break;
            case 'Rel-Time Travelers':
                window.open('#/view2', '_self', false);
                break;
            case 'Login':
                window.open('#/login', '_self', false);
                break;
            default:
                window.open('#/login', '_self', false);
        }

    };
});

//Login Facebook
trackerApp.controller('login1',
    ['$scope', '$timeout', 'Facebook', 'dataBaseService', 'messages', 'localStorageService', function ($scope, $timeout, Facebook, dataBaseService, messages, localStorageService) {

        $scope.user = {};

        // Defining user logged status
        $scope.logged = false;

        // And some fancy flags to display messages upon user status change
        // $scope.byebye = false;
        // $scope.salutation = false;

        /**
         * Watch for Facebook to be ready.
         * There's also the event that could be used
         */
        $scope.$watch(
            function () {
                return Facebook.isReady();
            },
            function (newVal) {
                if (newVal)
                    $scope.facebookReady = true;
            }
        );

        var userIsConnected = false;

        Facebook.getLoginStatus(function (response) {
            if (response.status == 'connected') {
                userIsConnected = true;
                //alert(userIsConnected);
            }else{
                userIsConnected = false;
            }
        });

        /**
         * IntentLogin
         */
        $scope.IntentLogin = function () {
            if (!userIsConnected) {
                $scope.login();
            }
        };

        /**
         * Login
         */
        $scope.login = function () {
            Facebook.login(function (response) {
                if (response.status == 'connected') {
                    $scope.logged = true;
                    $scope.me();
                }

            });
        };

        /**
         * me
         */
        $scope.me = function () {
            Facebook.api('/me?fields=id,name,email,timezone', function (response) {
                /**
                 * Using $scope.$apply since this happens outside angular framework.
                 */
                $scope.$apply(function () {
                    $scope.user = response;

                    console.log($scope.user);
                    //looks like:
                    // Object {id: "102211533498839", name: "Aladdin The Tracker", email: "aladdin_dejvjmt_tracker@tfbnw.net", timezone: 0}

                    //check if user exists
                    dataBaseService.checkUserExistsByEmail($scope.user).then(function (results) {

                        console.log(results.data.rows[0].exists);
                        messages.saveUser($scope.user); //save user anyway in client, anyway the user will be added.

                        //save to session storage
                        //should add, check what kind of storage
                        //should add, check is storage supported by browser
                        localStorageService.set('user', $scope.user.name);
                        localStorageService.set('email', $scope.user.email);

                        if (!results.data.rows[0].exists) {

                            //add new user
                            dataBaseService.addNewUser($scope.user).then(function (results) {

                            });
                        }

                        window.open('#/view0', '_self', false).location.reload();

                    })
                });
            });
        };

        /**
         * Logout
         */
        $scope.logout = function () {
            Facebook.logout(function () {
                $scope.$apply(function () {
                    $scope.user = {};
                    $scope.logged = false;
                    localStorageService.set('user', 'Guest');
                    localStorageService.set('email', '');
                    localStorageService.set('logged', $scope.logged);
                });
            });
        }

        /**
         * Taking approach of Events :D
         */
        $scope.$on('Facebook:statusChange', function (ev, data) {
            console.log('Status: ', data);
            if (data.status == 'connected') {
                $scope.$apply(function () {
                    //  $scope.salutation = true;
                    //   $scope.byebye = false;
                    $scope.logged = true;

                   // alert($scope.user.email);
                   // alert('email saved local:  '+localStorageService.get('email'));
                    localStorageService.set('logged', $scope.logged);
                });
            } else {
                $scope.$apply(function () {
                    //   $scope.salutation = false;
                    //    $scope.byebye = true;
                    $scope.logged = false;
                    localStorageService.set('logged', $scope.logged);

                    /*
                     // Dismiss byebye message after two seconds
                     $timeout(function () {
                     $scope.byebye = false;
                     }, 2000)
                     */
                });
            }


        })
    }])

    /**
     * Just for debugging purposes.
     * Shows objects in a pretty way
     */
    .directive('debug1', function () {
        return {
            restrict: 'E',
            scope: {
                expression: '=val'
            },
            template: '<pre>{{debug(expression)}}</pre>',
            link: function (scope) {
                // pretty-prints
                scope.debug = function (exp) {
                    return angular.toJson(exp, true);
                };
            }
        }
    });