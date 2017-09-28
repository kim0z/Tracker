trackerApp.controller('console', function($scope, messages) {

  $scope.path = messages.getPath();
  $scope.path_not_hash = [];

  for (var index = 0; index < $scope.path.length; index++) {
    //$scope.path_not_hash.concat($scope.path[index]);
    Array.prototype.push.apply($scope.path_not_hash, $scope.path[index]);
  }

});



