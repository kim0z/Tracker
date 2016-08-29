/**
 * Created by karim on 23/01/2016.
 */
trackerApp.controller('Login', function($scope, $location, auth, localStorageService) {
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
            $location.path('/user-info')
        }, function(err) {
            console.log("Error :(", err);
        });
  // }

});


