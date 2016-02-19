trackerApp.controller('view2Ctrl', function ($scope, $http, $document, dataBaseService, messages) {


        $scope.user = messages.getUser();
        $scope.travelersList = [];
        $scope.data = [];
        //$scope.init = function () {
        var trackCoordinates = [];
        $scope.map;
        $scope.lastGPSpoint = "";

        $scope.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 34.397, lng: 40.644},
            zoom: 5
        });

        var socket = io.connect('http://localhost:8080');
        socket.on('GpsPoint', function (data) {
            console.log(data);
            console.log('GPS new point: ' + data);


            //check if JSON is sign from a user about start GPS / or adding a new GPS point
            var userStatus = document.getElementById( data.email );

            if (data.hasOwnProperty('active')) {
                if(data.active == 'true'){
                    userStatus.style.background = "green";
                }else{
                    userStatus.style.background = "red";
                }





            } else {

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
            }

        });


        //get users names to push it into the list of active travelers
        dataBaseService.getUsersList().then(function (results) {
            console.log(results.data.rows.length);
            for (var i = 0; i < results.data.rows.length; i++) {
                $scope.travelersList.push(results.data.rows[i].name, results.data.rows[i].email);
            }
            loadItems = function () {
                for (var i = 0; i < $scope.travelersList.length; i++) {
                    $scope.data.push({
                        id: i + 1,
                        name: $scope.travelersList[i],
                        email: $scope.travelersList[i + 1]
                    });
                    $scope.id++;
                }
            }
            loadItems();
        })

//        $scope.id = 1;


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



