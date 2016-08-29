'use strict';

// Declare app level module which depends on views, and components
var trackerApp = angular.module('myApp', [
        'auth0',
        'nemLogging',
        'ui.router',
        'angular-jwt',
        'uiGmapgoogle-maps',
        'ngAutocomplete',
        'ui.grid',
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
        'firebase',
        'timer',
        'angular-flexslider',
        'angularjs-dropdown-multiselect'
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
                controller: 'view1Ctrl',
                data: {
                	requiresLogin: true
                }
            })
            .state('view2', {
                url: "/view2",
                templateUrl: "views/view2/view2.html",
                controller: 'view2Ctrl',
                 data: {
                	requiresLogin: true
                }
            })
            .state('view3', {
                url: "/view3",
                templateUrl: "views/view3/view3.html",
                controller: 'view3Ctrl',
                 data: {
                	requiresLogin: true
                }
            })
            .state('viewError', {
                url: "/viewError",
                templateUrl: "views/viewError/404.html",
                controller: 'viewErrorCtrl',
                 data: {
                	requiresLogin: true
                }
            })
            .state('login', {
                url: "/login",
                templateUrl: "views/login/login.html",
                controller: 'Login'
            })
            .state('offlinemap', {
                url: "/offlinemap",
                templateUrl: "views/offlinemap/offlinemap.html",
                controller: 'offlinemapCtrl',
                 data: {
                	requiresLogin: true
                }
            });
    })
    .config(function(authProvider) {

        // routing configuration and other stuff
        // ...

        authProvider.init({
            domain: 'exploreauth.auth0.com',
            clientID: 'QqJgTRPIWyFTKdpkMD8ATmeSwvw6oBCA',
            //loginUrl: '/login',
            loginState: 'login',
            callbackURL: location.herf
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
    })

    .constant('_', window._)
    // use in views, ng-repeat="x in _.range(3)"
    .run(function ($rootScope, auth, jwtHelper, localStorageService) {
        $rootScope._ = window._;
        auth.hookEvents();


	       // This events gets triggered on refresh or URL change
	  $rootScope.$on('$locationChangeStart', function() {
	    var token = localStorageService.get('token');
	    if (token) {
	      if (!jwtHelper.isTokenExpired(token)) {
	        if (!auth.isAuthenticated) {
	          auth.authenticate(localStorageService.get('profile'), token).then(function (profile) {

	                    console.log("Logged in via refresh token and got profile");

	                    console.log(profile);

	                    // Successful login, now redirect to secured content.

	                }, function (err) { });;
	        }
	      } else {
	        // Either show Login page or use the refresh token to get a new idToken
	      }
	    }
	});


 



    });





trackerApp.controller('mainIndexCtrl', function ($scope, localStorageService, auth, $state) {
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



    $scope.auth = auth;

    $scope.logout = function() {
    	auth.signout();
    	localStorageService.remove('profile');
        localStorageService.remove('token');

    	$state.go('login');
    }

    //Auth0


/*    var lock = new Auth0Lock(clientId, domain, {
        auth: {
            redirectUrl: 'http://localhost:9090/callback',
            responseType: 'code',
            params: {
                scope: 'openid email' // Learn about scopes: https://auth0.com/docs/scopes
            }
        }
    });





    lock.on("authenticated", function(authResult) {
        lock.getProfile(authResult.idToken, function(error, profile) {
            if (error) {
                // Handle error
                return;
            }

            localStorageService.setItem("idToken", authResult.idToken);
            localStorageService.setItem("profile", JSON.stringify(profile));

            // Update DOM
        });
    });*/






});



// LoginCtrl.js


/*
// UserInfo.js
trackerApp.controller('UserInfoCtrl', function(auth) {
    // Using a promise
    auth.profilePromise.then(function(profile) {
        $scope.profile = profile;
    });
    // Or using the object
    $scope.profile = auth.profile;
});
*/


//Login Facebook -- should be replaced with Native facebook SDK
trackerApp.controller('login1',
    ['$scope', '$timeout', 'Facebook', 'dataBaseService', 'messages', 'localStorageService', function ($scope, $timeout, Facebook, dataBaseService, messages, localStorageService) {


        console.log('User not exists, adding the user');
        var firebase_users_add_f = new Firebase("https://luminous-torch-9364.firebaseio.com/");
        firebase_users_add_f.set({'dsdfsdfsdfsdf':'sdsdfsdfsd'});



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
                //save Facebook auth into browser DB
                localStorageService.set('facebookAuth', response);


                var facebookId = response.authResponse.userID;
                console.log(facebookId);
                var loginPic = document.getElementById('loginPic');
                loginPic.style.background = "url(http://graph.facebook.com/" + facebookId + "/picture)";


            } else {
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
            }, {scope: 'publish_actions,user_photos'});
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



                    console.log('User not exists, adding the user');
                    var firebase_users_add_f = new Firebase("https://luminous-torch-9364.firebaseio.com/");
                    firebase_users_add_f.set($scope.user);


/*


                    //check if node 'users' exists, only for the init of the app, one time action
                    var firebase_users_node_exists = new Firebase("https://luminous-torch-9364.firebaseio.com/");

                    firebase_users_node_exists.once("value", function (snapshot) {
                        //if users node no exits it means no users was created at all
                        if (snapshot.hasChild('users') == false) {
                            //add the first user without check if it is exists (for sure he is not)
                            console.log('User not exists, adding the user');
                            var firebase_users_add = new Firebase("https://luminous-torch-9364.firebaseio.com/users/" + $scope.user.id);
                            firebase_users_add.set($scope.user);
                        } else {
                            //else, when users node already exists then we should check if the user already exists
*/


                            //
                            //check if user exists in Firebase
                            //load Table from Firebase
                            var firebase_users = new Firebase("https://luminous-torch-9364.firebaseio.com/");

                            firebase_users.once("value", function (snapshot) {

                                var exists = snapshot.child($scope.user.id).exists();

                                console.log('Exists or Not');
                                console.log(exists);


                                //if not exists then add to Firebase
                                if (exists == false) {
                                    console.log('User not exists, adding the user');
                                    var firebase_users_add = new Firebase("https://luminous-torch-9364.firebaseio.com/users/" + $scope.user.id);
                                    firebase_users_add.set($scope.user);
                                }

                            }, function (errorObject) {
                                console.log("Login:: check if user exists in Firebase " + errorObject.code);
                            });


                     //   }
                   // });


                    //if exists


                    //check if user exists
                    dataBaseService.checkUserExistsByEmail($scope.user).then(function (results) {

                        console.log(results.data.rows[0].exists);
                        messages.saveUser($scope.user); //save user anyway in client, anyway the user will be added.

                        //save to session storage
                        //should add, check what kind of storage
                        //should add, check is storage supported by browser
                        localStorageService.set('userFacebookAuth', $scope.user);
                        localStorageService.set('user', $scope.user.name);
                        localStorageService.set('email', $scope.user.email);
                        localStorageService.set('userID', $scope.user.id);

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