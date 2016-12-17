/**
 * Created by karim on 23/01/2016.
 */
trackerApp.controller('Login', function ($scope, $location, $state, $http, auth, localStorageService, serverSvc, messages) {
//  $scope.signin = function() {

    auth.signin({
        //popup: true,
        //connection: 'Username-Password-Authentication',
        connections: ['facebook'],
        closable: false,
        gravatar: false,
        primaryColor: '#3f51b5',
        icon: 'assets/icons/paw-xxl.png',
        socialBigButtons: true,
        disableSignupAction: true,

        authParams: {
            // Specify the scopes you want to retrieve
            scope: 'openid name email' // Specify the scopes you want to retrieve
        }
    }, function (profile, idToken, accessToken, state, refreshToken) {
        console.log(profile, idToken, accessToken, state, refreshToken);
        localStorageService.set('profile', profile);
        localStorageService.set('token', idToken);
        localStorageService.set('accessToken', accessToken);
        localStorageService.set('state', state);

        //get provider token
        serverSvc.getProviderToken(profile).then(function (results) {
            if(results == null || results ==''){
                console.log('Login:: could not get token from server');
            }else{
                localStorageService.set('providerToken', results.data.identities[0].access_token);
            }

        });

        //$state.go('welcome');
        $state.go(localStorageService.get('directToAfterLogin'));
        //window.open('#/'+localStorageService.get('directToAfterLogin'), '_self', false);
    }, function (err) {
        console.log("Error :(", err);
    });

});


