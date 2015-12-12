trackerApp.controller('view1Ctrl', function ($scope, $http, $q, $filter, googleMapsAPIService, dataBaseService, algorithmsService, messages, NgTableParams) {

        var dataTripId;
        $scope.polylines = [];
        $scope.circles = [];
        $scope.dates = [];
        $scope.table = {};

        //get trip data to the page
        $scope.trip_id = messages.getTripID();

        if ($scope.trip_id == '') {
            window.open ('#/viewError', '_self', false);
        }
        else {

            dataTripId = {trip_id: $scope.trip_id};
            dataBaseService.getTripById(dataTripId).then(function (results) {

                $scope.tripById = results.data;

                console.log('Client:: View3:: get trip by id::' + messages.getTripID());
                //example for how to get data from results console.log('trip  '+$scope.tripById[0].id);

                //################################### Fill all fields of Trip definition #########################
                console.log('end date: '+$scope.tripById[0].end_date);
                console.log('start day: '+$scope.tripById[0].start_date);
                console.log('trip desc: '+$scope.tripById[0].trip_description);

                $scope.tripName = $scope.tripById[0].trip_name;
                $scope.tripDescription = $scope.tripById[0].trip_description;
                //$scope.dateStart = $scope.tripById[0].start_date;
                //$scope.dateEnd = $scope.tripById[0].end_date;

                $scope.dateStart = $filter('date')($scope.tripById[0].start_date, 'MMM d, y');
                $scope.dateEnd = $filter('date')($scope.tripById[0].end_date,'MMM d, y');

                var daysSum = 0;

                if (results.data[0].table_plan) {
                    $scope.destinations = []; //clean destinations input
                    //get city name and number of days and fill into input fields
                    for (var i = 0; i < results.data[0].table_plan.length; i++) {
                        $scope.destinations.push({
                            city: $scope.tripById[0].table_plan[i]['city' + i],
                            days: $scope.tripById[0].table_plan[i]['days' + i]
                        });
                        daysSum = daysSum + parseInt($scope.tripById[0].table_plan[i]['days' + i]);
                    }
                }


                //dates for table
                //convert date to object to allow me do action on it like increase the date in the table
                var startDate = $scope.tripById[0].start_date;
                var dateInNumberFormat = new Date(startDate).getTime();
                //create array for the dates to show it on table, each cell will have 1 extra day
                //var day = 1000 * 3600 * 24; //day in miliseconds 1000 * 3600 = hour
                var month = new Date(dateInNumberFormat).getUTCMonth() + 1; //months from 1-12
                var day = new Date(dateInNumberFormat).getUTCDate();
                var year = new Date(dateInNumberFormat).getUTCFullYear();
                $scope.dates[0] = month+'/'+day+'/'+year;

                for(var i = 1; i < daysSum ; i++){
                    var anotherDay = 1000 * 3600 * (i * 24);
                    //$scope.dates[i] = new Date(dateInNumberFormat + day).toString("MMMM yyyy");

                    var month = new Date(dateInNumberFormat + anotherDay).getUTCMonth() + 1; //months from 1-12
                    var day = new Date(dateInNumberFormat + anotherDay).getUTCDate();
                    var year = new Date(dateInNumberFormat + anotherDay).getUTCFullYear();
                    $scope.dates[i] = month+'/'+day+'/'+year;
                }

                //############################### Google maps - Circles + Polyline #######################################

                //load geoCode for the trip cities
                var polyline = getTemplatePolyLine(); // get polyline template

                Promise.resolve(LoadGeoCode($scope.tripById[0])).then(function (result) {
                    //loop the results to find the latitude, longitude
                    //push each point to google maps circle and polyline
                    for (var i = 0; i < result.length; i++) {
                        var circle = getTemplate();
                        circle['id'] = i;
                        circle['center'].latitude = result[i]['data'][0]['latitude'];
                        circle['center'].longitude = result[i]['data'][0]['longitude'];
                        $scope.circles.push(circle);

                        polyline[0].path.push({
                            latitude: result[i]['data'][0]['latitude'],
                            longitude: result[i]['data'][0]['longitude']
                        });

                        //set map center to be the first destination
                        if(i == 0){
                            $scope.map = {
                                center: {
                                    latitude: result[i]['data'][0]['latitude'],
                                    longitude: result[i]['data'][0]['longitude']
                                },
                                zoom: 4
                            };
                        }

                        $scope.polylines = polyline;
                    }
                }, function (result) {
                    //not called
                });

            });


            //##################################### Create Table ####################################
            dataBaseService.createTable(dataTripId).then(function (results) {
               // $scope.table = results.data;
                //algorithmsService.whenFlightNeeded(results.data).then(function (results) {
               $scope.table =  algorithmsService.whenFlightNeeded(results.data); // This alg check weather flight needed and give true
                    //$scope.table = results.data;

                //Request flight for each true flight
                //{origin: "TLV", destination:"JFK", date:"2015-12-30", solutions: 10};
                //var flightParam = {origin: "TLV", destination:"JFK", date:"2015-12-30", solutions: 10};
                //dataBaseService.getFlights();

                    /*
                     response example: [{"day":1,"city":"haifa","flight":"","car":"","action1":"","action2":""},{"day":2,"city":"london","flight":"","car":"","action1":"","action2":""},{"day":3,"city":"london","flight":"","car":"","action1":"","action2":""},{"day":4,"city":"london","flight":"","car":"","action1":"","action2":""},{"day":5,"city":"new york","flight":"","car":"","action1":"","action2":""},{"day":6,"city":"new york","flight":"","car":"","action1":"","action2":""},{"day":7,"city":"new york","flight":"","car":"","action1":"","action2":""},{"day":8,"city":"new york","flight":"","car":"","action1":"","action2":""},{"day":9,"city":"paris","flight":"","car":"","action1":"","action2":""},{"day":10,"city":"paris","flight":"","car":"","action1":"","action2":""},{"day":11,"city":"madrid","flight":"","car":"","action1":"","action2":""},{"day":12,"city":"madrid","flight":"","car":"","action1":"","action2":""},{"day":13,"city":"madrid","flight":"","car":"","action1":"","action2":""},{"day":14,"city":"madrid","flight":"","car":"","action1":"","action2":""},{"day":15,"city":"mali","flight":"","car":"","action1":"","action2":""},{"day":16,"city":"chad","flight":"","car":"","action1":"","action2":""}]
                     */

                    var itemsArray = [];
                    var flightsFlag = [];
                    for (var i = 0; i < $scope.table.length; i++) {
                        itemsArray.push($scope.table[i]);

                        flightsFlag[i] = $scope.table[i].flight.flight; // update each day in the table with the flag

                    }

                    $scope.items = itemsArray;

                    $scope.flightsFlag = flightsFlag;


//this $scope.userTable --> not sure if reuired because I'm using $scope.items in the ng repeat
                    $scope.usersTable = new NgTableParams({
                        page: 1,
                        count: 10
                    }, {
                        total: $scope.items.length,
                        getData: function ($defer, params) {
                            $scope.data = $scope.items.slice((params.page() - 1) * params.count(), params.page() * params.count());
                            $defer.resolve($scope.data);
                        }
                    });


                //go over all the days in table, check the flag of flight if True then get flights for that day, to the next day

                for(var dayIndex = 0 ; dayIndex < $scope.table.length ; dayIndex++){
                    if($scope.table[0].flight.flight && dayIndex < $scope.table.length - 1){
                        var flightParam = {origin: $scope.table[dayIndex].city, destination:$scope.table[dayIndex+1].city, date:"2015-12-30", solutions: 10};
                        console.log(flightParam);
                        googleMapsAPIService.getFlights(flightParam);
                    }
                }





               // })


               // console.log('Client:: View3:: Create Table::' + $scope.data);
                //console.log($scope.table.length);

                //check with algorithmsService about flights


            });

        }


//Google maps section
        $scope.destinations = [
            {
                city: ""
            }
        ];

        $scope.addNewDestination = function (dest) {
            $scope.destinations.push({
                city: ""
            });
        };

        $scope.map = {
            center: {
                latitude: 37.79,
                longitude: -122.4175
            },
            zoom: 13
        };

        $scope.map = {center: {latitude: 44, longitude: -108}, zoom: 4};
        $scope.options = {scrollwheel: false};
        /*     $scope.circles = [
         {
         id: 1,
         center: {
         latitude: 44,
         longitude: -108
         },
         radius: 100000,
         stroke: {
         color: '#08B21F',
         weight: 2,
         opacity: 1
         },
         fill: {
         color: '#08B21F',
         opacity: 0.5
         },
         geodesic: true, // optional: defaults to false
         draggable: true, // optional: defaults to false
         clickable: true, // optional: defaults to true
         editable: true, // optional: defaults to false
         visible: true, // optional: defaults to true
         control: {}
         }
         ];*/


        $scope.onBlur = function (dest) {

            console.log($scope.polylines);

            console.log(event.target.name);

            var jsonTripGeneralInfo = {};
            var jsonTripTableCity = {};
            var tableArray = []
            var jsonTrip = {};
            var jsonMain = {};

            var jsonTablePlan = [];

            //save all the general information about the trip
            jsonTripGeneralInfo = {
                trip_id: messages.getTripID(), //internal use for updating
                trip_name: $scope.tripName,
                trip_description: $scope.tripDescription,
                start_date: $scope.dateStart,
                end_date: $scope.dateEnd,
                continent: 'America'
            };

            //save all destination (cities) to json file
            for (var i = 0; i < $scope.destinations.length; i++) {
                jsonTripTableCity['city' + i] = $scope.destinations[i].city;
                jsonTripTableCity['days' + i] = $scope.destinations[i].days;
                jsonTripTableCity['general' + i] = {flight: '', hotel: '', car: '', action1: '', action2: ''};
                tableArray.push(jsonTripTableCity)
                jsonTripTableCity = {};
            }

            jsonTrip = {'general': jsonTripGeneralInfo, 'table_plan': tableArray};

            //jsonMain = {"username":{'trips':jsonTrip}};
            jsonMain = {"username": {'trip': jsonTrip}};

            var r = /\d+/;
            var s = event.target.name;
            var cityNumber = s.match(r);

            //save the cities list to data base
            dataBaseService.updateTrip(jsonMain)
                .success(function (data, status, headers, config) {
                    //$scope.message = data; //handle data back from server - not needed meanwhile
                    console.log(jsonMain);
                })
                .error(function (data, status, headers, config) {
                    console.log("failure message: " + JSON.stringify({data: data}));
                });

            //##################################### Create Table ####################################
            dataBaseService.createTable(dataTripId).then(function (results) {
                $scope.table = results.data;
                //$scope.data = [$scope.table[0]];

                //var self = this;
                //var data = [{name: "Moroni", age: 50},{name: "Moroni", age: 50}];
                //self.tableParams = new NgTableParams({}, { dataset: data});


                var itemsArray = [];
                for (var i = 0; i < $scope.table.length; i++)
                    itemsArray.push($scope.table[i]);

                $scope.items = itemsArray;


                $scope.usersTable = new NgTableParams({
                    page: 1,
                    count: 10
                }, {
                    total: $scope.items.length,
                    getData: function ($defer, params) {
                        $scope.data = $scope.items.slice((params.page() - 1) * params.count(), params.page() * params.count());
                        $defer.resolve($scope.data);
                    }
                });


                console.log('Client:: View3:: Create Table::' + $scope.table);
                console.log($scope.table.length);
            });

            //############################### Google maps - Circles + Polyline #######################################

            //get trip again because maybe new cities where added
            dataTripId = {trip_id: $scope.trip_id};
            dataBaseService.getTripById(dataTripId).then(function (results) {
                console.log($scope.circles);
                //load geoCode foe the trio cities
                var polyline = getTemplatePolyLine(); // get polyline template

                Promise.resolve(LoadGeoCode($scope.tripById[0])).then(function (result) {
                    //loop the results to find the latitude, longitude
                    //push each point to google maps circle and polyline
                    for (var i = 0; i < result.length; i++) {

                        var circle = getTemplate();
                        circle['id'] = i + $scope.circles.length;
                        circle['center'].latitude = result[i]['data'][0]['latitude'];
                        circle['center'].longitude = result[i]['data'][0]['longitude'];
                        $scope.circles.push(circle);

                        polyline[0].path.push({
                            latitude: result[i]['data'][0]['latitude'],
                            longitude: result[i]['data'][0]['longitude']
                        });

                        $scope.polylines = polyline;
                    }
                }, function (result) {
                    //not called
                });
            });

            //################################# Google map ends ####################################

        }
//################################################ Blur event end here #################################

// ##################### Google maps ###########################
        function LoadGeoCode(trip) {

            var deferred = $q.defer(); // init
            var citiesWithData = [];
            var promises = [];

            function pushPromiseByCity(idx) {
                var city = {city: trip.table_plan[idx]['city' + idx]};
                return googleMapsAPIService.getGeoCode(city)
                    .then(function (result) {
                        citiesWithData[idx] = result;
                    });
            }

            for (var i = 0; i < trip.table_plan.length; i++) {
                promises.push(pushPromiseByCity(i));
            }

            // execute all promises
            $q.all(promises)
                .finally(function () {
                    // when done return data array
                    deferred.resolve(citiesWithData); // resolve
                });

            return deferred.promise; //return
        }

        //############################ Google maps end ################################

        function getTemplate() {
            var circleTemplate = {
                id: 1,
                center: {
                    latitude: 44,
                    longitude: -108
                },
                radius: 90000,
                stroke: {
                    color: '#08B21F',
                    weight: 2,
                    opacity: 1
                },
                fill: {
                    color: '#08B21F',
                    opacity: 0.5
                },
                geodesic: true, // optional: defaults to false
                draggable: true, // optional: defaults to false
                clickable: true, // optional: defaults to true
                editable: true, // optional: defaults to false
                visible: true, // optional: defaults to true
                control: {}
            };
            return circleTemplate;
        }

        function getTemplatePolyLine() {

            var polylinesTemplate = [
                {
                    id: 1,
                    path: [/*
                        {
                            latitude: 45,
                            longitude: -74
                        },
                        {
                            latitude: 30,
                            longitude: -89
                        }
                    */],
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
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                        },
                        offset: '25px',
                        repeat: '50px'
                    }]
                }
            ];

            return polylinesTemplate;
        }


    }
);