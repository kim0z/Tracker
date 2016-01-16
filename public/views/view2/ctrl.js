trackerApp.controller('view2Ctrl', function ($scope, $http, googleMapsAPIService, dataBaseService) {

    $scope.init = function () {

        Promise.resolve(dataBaseService.getGpsTrack()).then(function (val) {
            //console.log(val.data);

            for (var k in val.data) {

                console.log(val.data[k].latitude);
                console.log(val.data[k].longitude);
                $scope.polylines[0].path.push({latitude: val.data[k].latitude, longitude: val.data[k].longitude  });
             }

            console.log($scope.polylines[0].path);
        })


        var socket = io.connect('http://localhost:8080');
        socket.on('GpsPoint', function (data) {
            console.log(data);
            socket.emit('my other event', { my: 'data' });
        });

    };

    $scope.polylines = [
        {
            id: 1,
            path: [
              /*  {
                    latitude: 45,
                    longitude: -74
                },
                {
                    latitude: 30,
                    longitude: -89
                },
                {
                    latitude: 37,
                    longitude: -122
                },
                {
                    latitude: 60,
                    longitude: -95
                }
                */
            ],
            stroke: {
                color: '#6060FB',
                weight: 3
            },
            editable: true,
            draggable: true,
            geodesic: true,
            visible: true,
            icons: [{
                icon: {
                    path: google.maps.SymbolPath.BACKWARD_OPEN_ARROW
                },
                offset: '25px',
                repeat: '50px'
            }]
        },
      /*  {
            id: 2,
            path: [
                {
                    latitude: 47,
                    longitude: -74
                },
                {
                    latitude: 32,
                    longitude: -89
                },
                {
                    latitude: 39,
                    longitude: -122
                },
                {
                    latitude: 62,
                    longitude: -95
                }
            ],
            stroke: {
                color: '#6060FB',
                weight: 3
            },
            editable: true,
            draggable: true,
            geodesic: true,
            visible: true,
            icons: [{
                icon: {
                    path: google.maps.SymbolPath.BACKWARD_OPEN_ARROW
                },
                offset: '25px',
                repeat: '50px'
            }]
        }*/
    ];



    //console.log('karim '+ $scope.polylines[0].id);

    $scope.map = {
        center: {
            latitude: 37.79,
            longitude: -122.4175
        },
        zoom: 12
    };


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