trackerApp.controller('view1Ctrl', function ($scope, $http, $q, $filter, googleMapsAPIService, dataBaseService, algorithmsService, flightAPIService, messages, NgTableParams, localStorageService) {
    "use strict";

    /*
     $scope.result1 = 'initial value';
     $scope.options1 = null;
     $scope.details1 = '';
     */
    var dataTripId;
    $scope.polylines = [];
    $scope.circles = [];
    $scope.dates = [];
    $scope.table = {};
    $scope.flightsByPrice = [];

    var city_Lat_Lng = []; // here will be saved each city and Lat, Lng point to be used later when ask airport

$scope.continents = ["Africa", "Europe", "Asia", "North America", "South America", "Antarctica", "Australia"];

    //get trip data to the page
    $scope.trip_id = messages.getTripID();

    //Map configuration
    $scope.map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 34.397, lng: 40.644},
        zoom: 5,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });


    if ($scope.trip_id == '') {
        window.open('#/viewError', '_self', false);
    }
    else {

        dataTripId = {trip_id: $scope.trip_id};
        dataBaseService.getTripById(dataTripId).then(function (results) {

            $scope.tripById = results.data;

            console.log('Client:: View1:: get trip by id::' + messages.getTripID());
            //example for how to get data from results console.log('trip  '+$scope.tripById[0].id);

            //################################### Fill all fields of Trip definition #########################
            console.log('end date: ' + $scope.tripById[0].end_date);
            console.log('start day: ' + $scope.tripById[0].start_date);
            console.log('trip desc: ' + $scope.tripById[0].trip_description);

            $scope.tripName = $scope.tripById[0].trip_name;
            $scope.tripDescription = $scope.tripById[0].trip_description;
            //$scope.dateStart = $scope.tripById[0].start_date;
            //$scope.dateEnd = $scope.tripById[0].end_date;

            $scope.dateStart = $filter('date')($scope.tripById[0].start_date, 'MMM d, y');
            $scope.dateEnd = $filter('date')($scope.tripById[0].end_date, 'MMM d, y');

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

                //############################### Google maps - Circles + Polyline #######################################

                //help function
                // if(results.data[0].table_plan.length != null) //when the trip just created, nothing to draw

                //call draw when cities > 1
                if($scope.destinations.length > 1)
                    drawOnMap($scope.trip_id);

                //################# Table ############################


                //Create Table

                createTable();

            }
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
            email: localStorageService.get('email'),
            trip_id: messages.getTripID(), //internal use for updating
            trip_name: $scope.tripName,
            trip_description: $scope.tripDescription,
            start_date: $scope.dateStart,
            end_date: $scope.dateEnd,
            continent: 'America'
        };


        //not relevant to update table in DB in this way, the data that should be updates is the selected data
        //save all destination (cities) to json file


        // function thing_with_callback(callback) {
        if ($scope.destinations.length > 0) {
            var promises = [];
            for (let i = 0; i < $scope.destinations.length; i++) {

                var promise = LoadGeoCodeForCity({city: $scope.destinations[i].city});

                promise.then(function (res) {

                    jsonTripTableCity['cityGoogleInf' + i] = res.data;

                    jsonTripTableCity['city' + i] = $scope.destinations[i].city;
                    jsonTripTableCity['days' + i] = $scope.destinations[i].days;
                    jsonTripTableCity['general' + i] = {flight: '', hotel: '', car: '', action1: '', action2: ''};

                    tableArray[i] = jsonTripTableCity;
                    jsonTripTableCity = {};

                }, function (err) {
                    console.error('one promise failed', err);
                });

                promises.push(promise);
            }


            $q.all(promises).then(function (results) {
                afterTripJsonIsReadyToSaved(results);
            }, function (err) {
                console.error('One of all the promises failed', err);
            });

        }

        function afterTripJsonIsReadyToSaved(results) {

            jsonTrip = {'general': jsonTripGeneralInfo, 'table_plan': tableArray};
            jsonMain = {"username": {'trip': jsonTrip}};

            /*
             var r = /\d+/;
             var s = event.target.name;
             var cityNumber = s.match(r);
             */

            //save updated trip into DB
            dataBaseService.updateTrip(jsonMain)
                .success(function (data, status, headers, config) {
                    //$scope.message = data; //handle data back from server - not needed meanwhile
                    console.log(jsonMain);
                })
                .error(function (data, status, headers, config) {
                    console.log("failure message: " + JSON.stringify({data: data}));
                });


            //Draw path on Map :: first get trip again to be updated with new saved data
            dataTripId = {trip_id: $scope.trip_id};
            dataBaseService.getTripById(dataTripId).then(function (results) {
                $scope.tripById = results.data;

                //call draw when cities > 1
                if($scope.destinations.length > 1)
                    drawOnMap($scope.trip_id);

                //Create Table
                createTable();
            });
        }
    }


//################################################ Blur event end here #################################

// ##################### Google maps ###########################
/* not in use any more
    //Load GeoCode for all cities in trip
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


        return deferred.promise;
    }
*/

    // Load GeoCode for 1 city, day is from table, it's an object that contain data from trip, city name and more
    function LoadGeoCodeForCity(cityObj) {

        return googleMapsAPIService.getGeoCode(cityObj);

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

 /*
    function getTemplatePolyLine() {

        var polylinesTemplate = [
            {
                id: 1,
                path: [/!*
                 {
                 latitude: 45,
                 longitude: -74
                 },
                 {
                 latitude: 30,
                 longitude: -89
                 }
                 *!/],
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
    }*/


    //################ Help functions ##########################

    function createTable() {



        dataBaseService.getTripById(dataTripId).then(function (result) {

            var table = [];

            var dayNumber = 0;
            for (var i = 0; i < result['data'][0]['table_plan'].length; i++) {
                for (var j = 0; j < result['data'][0]['table_plan'][i]['days'+i]; j++) {
                    dayNumber++;
                    var day = {
                        //  date: $scope.dateStart,
                        date: result['data'][0]['start_date'],
                        day: dayNumber,
                        city: result['data'][0]['table_plan'][i]['city'+i],
                        flight: {flight: false, airport: [], price: 0},
                        car: '',
                        action1: '',
                        action2: '',
                        cityGoogleInf: result['data'][0]['table_plan'][i]['cityGoogleInf'+i]
                    };

                    table.push(day);

                    day = '';
                }
            }
            //return table;
            $scope.table = table;

            if(dayNumber > 1)
                addFlightsToTable();


        });

    }


    // table - get flights
    function addFlightsToTable() {

        //algorithmsService.buildFlights($scope.table));
        algorithmsService.buildFlights($scope.table).then(function(){
            console.log('all flights done and ready to be presented into UI!',$scope.table);






        });


    }


    function getAirPortCode(city) {

        if (city_Lat_Lng) {
            for (var i = 0; i < city_Lat_Lng.length; i++) {
                if (city.indexOf(city_Lat_Lng[i].data[0].city) > -1) {
                    return city_Lat_Lng[i].data[0]
                    break;
                }
            }
        }


    }


// draw path + icons on google maps
    function drawOnMap(tripId) {
        // dataTripId = {trip_id: $scope.trip_id};
        dataTripId = {trip_id: tripId};
        var path = [];


        dataBaseService.getTripById(dataTripId).then(function (result) { //get the update trip data from DB then ask for all cities information from Google
            console.log($scope.circles);
            //load geoCode foe the trio cities
           // var polyline = getTemplatePolyLine(); // get polyline template

            $scope.tripById = result.data;

         //   Promise.resolve(LoadGeoCode($scope.tripById[0])).then(function (result) { // add cities information from Google (
                //loop the results to find the latitude, longitude
                //push each point to google maps circle and polyline


//$scope.tripById.table_plan[idx]['cityGoogleInf' + idx]

                // city_Lat_Lng = result;

                //  for (var i = 0; i < result.length; i++) {

                for (var i = 0; i < $scope.tripById[0]['table_plan'].length; i++) {

                    //set map center to be the first destination
                    if (i == 0) {
                        $scope.map = {
                            center: {
                                //latitude: result[i]['data'][0]['latitude'],
                               // longitude: result[i]['data'][0]['longitude']
                                latitude: $scope.tripById[0].table_plan[i]['cityGoogleInf' + i][0]['latitude'],
                                longitude: $scope.tripById[0].table_plan[i]['cityGoogleInf' + i][0]['longitude']
                            },
                            zoom: 4
                        };
                    }

                    /*
                     console.log('inside')
                     var circle = getTemplate();
                     circle['id'] = i + $scope.circles.length;
                     circle['center'].latitude = result[i]['data'][0]['latitude'];
                     circle['center'].longitude = result[i]['data'][0]['longitude'];
                     $scope.circles.push(circle);
                     */
                    /*
                     polyline[0].path.push({
                     latitude: result[i]['data'][0]['latitude'],
                     longitude: result[i]['data'][0]['longitude']
                     });
                     */

                    path.push({
                        lat: $scope.tripById[0]['table_plan'][i]['cityGoogleInf' + i][0]['latitude'],
                        lng: $scope.tripById[0]['table_plan'][i]['cityGoogleInf' + i][0]['longitude']
                    });


                    //end

                    if (i == $scope.tripById[0]['table_plan'].length - 1) { //we already have the Lat, Long of each city, now let's create the line between the cities

                        $scope.map = new google.maps.Map(document.getElementById('map'), {
                            center: path[path.length - 1],
                            zoom: 3,
                            mapTypeId: google.maps.MapTypeId.TERRAIN
                        });


                        //dashed line
                        var lineSymbol = {
                            path: 'M 0,-1 0,1',
                            strokeOpacity: 1,
                            scale: 4
                        };
                        //  var trackPath_users


                        var poly = new google.maps.Polyline({
                            path: path,
                            map: $scope.map,
                            geodesic: true,
                            strokeColor: '#0000FF',
                            strokeOpacity: 0,
                            strokeWeight: 2,
                            icons: [{
                                icon: lineSymbol,
                                offset: '0',
                                repeat: '20px'
                            }]
                        });

                        poly.setMap($scope.map);

                        for (var i = 0; i < path.length; i++) {


                            var marker = new google.maps.Marker({
                                position: path[i],
                                label: i.toString(),
                                map: $scope.map
                            });


                            marker.setMap($scope.map);
                        }

                    }

                }
                console.log('outside loop');

        });


    }

    function getDateAfterDays(date, days) {
        //convert date to object to allow me do action on it like increase the date in the table
        var startDate = date;
        var dateInNumberFormat = new Date(startDate).getTime();
        //create array for the dates to show it on table, each cell will have 1 extra day
        //var day = 1000 * 3600 * 24; //day in miliseconds 1000 * 3600 = hour
        var month = new Date(dateInNumberFormat).getUTCMonth() + 1; //months from 1-12
        var day = new Date(dateInNumberFormat).getUTCDate();
        var year = new Date(dateInNumberFormat).getUTCFullYear();
        //$scope.dates[0] = month + '/' + day + '/' + year;

        //  for (var i = 1; i < daysSum; i++) {
        var anotherDay = 1000 * 3600 * (days * 24);
        //$scope.dates[i] = new Date(dateInNumberFormat + day).toString("MMMM yyyy");

        var month = new Date(dateInNumberFormat + anotherDay).getUTCMonth() + 1; //months from 1-12
        var day = new Date(dateInNumberFormat + anotherDay).getUTCDate();
        var year = new Date(dateInNumberFormat + anotherDay).getUTCFullYear();
        var nextDate = month + '/' + day + '/' + year;
        return nextDate;

    }

    //############## End Help functions ###########################


});
