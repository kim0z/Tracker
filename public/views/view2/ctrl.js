trackerApp.controller('view2Ctrl',function($scope, $http, googleMapsAPIService, dataBaseService) {

    $scope.map = {
        center: {
            latitude: 37.79,
            longitude: -122.4175
        },
        zoom: 12
    };


    $scope.data = [];
    $scope.id = 1;

    loadItems = function(){
        for(var i = 0; i < 50; i++){
            $scope.data.push({
                id: $scope.id,
                name: "Name " + $scope.id,
                description: "Description " + $scope.id
            });
            $scope.id++;
        }
    }
    loadItems();




})


.directive('infiniteScroll', function(){
    return {
        restrict: 'A',
        scope: {
            ajaxCall: '&'
        },
        link: function (scope, elem, attrs){
            box = elem[0];
            elem.bind('scroll', function(){
                if((box.scrollTop + box.offsetHeight) >= box.scrollHeight){
                    scope.$apply(scope.ajaxCall)
                }
            })
        }
    }
})