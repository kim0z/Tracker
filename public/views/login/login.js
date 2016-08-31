/**
 * Created by karim on 23/01/2016.
 */
trackerApp.controller('Login', function($scope, $location, $state,  auth, localStorageService) {
//  $scope.signin = function() {
        auth.signin({
            //popup: true,
            authParams: {
                scope: 'openid name email' // Specify the scopes you want to retrieve
            }
        }, function(profile, idToken, accessToken, state, refreshToken) {
            console.log(profile, idToken, accessToken, state, refreshToken);
             localStorageService.set('profile', profile);
             localStorageService.set('token', idToken);
             $state.go('view0');
        }, function(err) {
            console.log("Error :(", err);
        });
  // }

});


