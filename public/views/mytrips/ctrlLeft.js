trackerApp.controller('LeftCtrl', function($scope, $timeout, $mdSidenav) {
    $scope.close = function() {
        $mdSidenav('left').close();
    };
});