trackerApp.controller('console', function ($scope, messages) {

    $scope.path = messages.getPath();
    $scope.path_not_hash = [];

    for (var index = 0; index < $scope.path.length; index++) {
        Array.prototype.push.apply($scope.path_not_hash, $scope.path[index]);
    }

    for (var i = 0; i < $scope.path_not_hash.length; i++) {
        if (!$scope.path_not_hash[i].hasOwnProperty('timestamp')) {
            console.log('Has no timestamp:::::::')
            console.log($scope.path_not_hash[i]);
            console.log('******************************')
        } else if ($scope.path_not_hash[i].timestamp > $scope.path_not_hash[i + 1].timestamp) {
            console.log('index : ' + i)
            console.log($scope.path_not_hash[i].timestamp);
            console.log($scope.path_not_hash[i + 1].timestamp);
            console.log('..........................');
        }
    }
});



