trackerApp.controller('DialogController', function($scope, $mdDialog, name) {
    $scope.userName = name;
    $scope.closeDialog = function() {
        $mdDialog.hide();
    };
});