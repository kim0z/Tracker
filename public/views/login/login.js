/**
 * Created by karim on 23/01/2016.
 */
trackerApp.controller('Login', function($scope, $location, $state, $http, auth, localStorageService) {
//  $scope.signin = function() {

    auth.signin({
            //popup: true,
            authParams: {
                // Specify the scopes you want to retrieve
            }
        }, function(profile, idToken, accessToken, state, refreshToken) {
            console.log(profile, idToken, accessToken, state, refreshToken);
             localStorageService.set('profile', profile);
             localStorageService.set('token', idToken);
             localStorageService.set('accessToken', accessToken);
             localStorageService.set('state', state);
             GG();
             $state.go('view0');
        }, function(err) {
            console.log("Error :(", err);
        });
  // }



   var GG = function(){
                 console.log('User ID');
               console.log(localStorageService.get('profile').user_id);
                    return $http(
                        {
                            method: 'GET',
                            url: 'https://exploreauth.auth0.com/api/v2/users/' + localStorageService.get('profile').user_id,
                            headers: {
                                Authorization: 'Bearer ' + localStorageService.get('token')
                            }
                        }
                    );
                };



});


