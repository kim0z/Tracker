trackerApp.controller('view2Ctrl', function ($scope, $http, dataBaseService) {


        //$scope.init = function () {
        var trackCoordinates = [];
        $scope.map;

            $scope.map = new google.maps.Map(document.getElementById('map'), {
                center: {lat: 34.397, lng: 40.644},
                zoom: 5
            });

    /*
        Promise.resolve(dataBaseService.getGpsTrack()).then(function (val) {
            for (var k in val.data) {

                console.log(val.data[k].latitude);
                console.log(val.data[k].longitude);
                $scope.polylines[0].path.push({latitude: val.data[k].latitude, longitude: val.data[k].longitude});
            }
            console.log($scope.polylines[0].path);
        });
*/
        var socket = io.connect('http://localhost:8080');
        socket.on('GpsPoint', function (data) {
            console.log(data);
            console.log('GPS new point: ' + data);


            trackCoordinates.push({lat: JSON.parse(data.latitude), lng: JSON.parse(data.longitude)});

            var trackPath = new google.maps.Polyline({
                path: trackCoordinates,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            console.log(trackCoordinates);

            trackPath.setMap($scope.map);

        });

        $scope.data = [];
        $scope.id = 1;

        loadItems = function () {
            for (var i = 0; i < 50; i++) {
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


    .directive('infiniteScroll', function () {
        return {
            restrict: 'A',
            scope: {
                ajaxCall: '&'
            },
            link: function (scope, elem, attrs) {
                box = elem[0];
                elem.bind('scroll', function () {
                    if ((box.scrollTop + box.offsetHeight) >= box.scrollHeight) {
                        scope.$apply(scope.ajaxCall)
                    }
                })
            }
        }
    })



