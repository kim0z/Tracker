trackerApp.controller('view1Ctrl', function ($scope, $http, googleMapsAPIService, dataBaseService) {

    function getTemplate() {
        var circleTemplate = {
            id: 1,
            center: {
                latitude: 44,
                longitude: -108
            },
            radius: 10000,
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

    //  var circle =
//this below shoould be used only in edit mode when called from the Trip List page
    /*
    dataBaseService.getTrip().then(function (results) {
            // Do something with results
            var tripData = results.data;
            var cities = tripData.cities;

            //if we already have the trip data then we will fill the fields
            //////// set valuse for the trip ////////////////////
            if (tripData.general.general["trip_name"]) {
                $scope.tripName = {
                    text: tripData.general.general["trip_name"],
                    word: /^\s*\w*\s*$/
                };
                $scope.dateStart = {
                    text: tripData.general.general["start_date"]
                };
                $scope.dateEnd = {
                    text: tripData.general.general["end_date"]
                };
            }
            if (cities) {
                console.log('lsfsfsfsfsf' + cities.length)
                for (var i = 0; i < cities.length; i++) {
                    if (i < cities.length - 1) { // city input already exists
                        $scope.addNewDestination();
                    }

                    $scope.destinations[i].city = cities[i];

                }
            }


            $scope.geoCode = googleMapsAPIService.createCircles(cities);


            Promise.resolve($scope.geoCode).then(function (val) { // why 3 promises
                for (var i = 0; i < val.length; i++) {

                    Promise.resolve(val[i]).then(function (val2) {   // recursive behave, first the val[1] then val[0], ask about it?
                        console.log('city: ' + val2.data[0].city);
                        console.log('latitude: ' + val2.data[0].latitude);
                        console.log('longitude: ' + val2.data[0].longitude);

                        console.log('index ' + i);
                        var circle = getTemplate();
                        circle['id'] = Math.floor((Math.random() * 100) + 2); // remove the random to be serial id
                        circle['center'].latitude = val2.data[0].latitude;
                        circle['center'].longitude = val2.data[0].longitude;
                        console.log(circle);

                        $scope.circles.push(circle);
                        // circleArray[circleArray.length+1] = circle;

                        console.log($scope.circles);
                        // console.log(circleArray);
                    })
                }
            })

        }
    );

*/
    /*
    dataBaseService.getLastTripId().then(function (results) {

        //save New Trip when open the page
        dataBaseService.saveNewTrip(jsonTrip)
            .success(function (data, status, headers, config) {
                //$scope.message = data; //handle data back from server - not needed meanwhile
                console.log(jsonTrip);
            })
            .error(function (data, status, headers, config) {
                console.log("failure message: " + JSON.stringify({data: data}));
            });
    });
    */

    //get last trip id from server
    dataBaseService.getLastTripId()
        .success(function (data, status, headers, config) {
            $scope.lastTripId = data;
            $scope.newTripId = parseInt($scope.lastTripId) + 1;
        })
        .error(function (data, status, headers, config) {
            console.log("failure message getLastTripId: " + JSON.stringify({data: data}));
        });


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
    $scope.circles = [
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
    ];


    $scope.onBlur = function (dest) {

        console.log(event.target.name);
        //console.log(angular.toJson(dest));

        //create Json with trip id, name, dates
        var jsonTripGeneralInfo = {};  // dates, name, could be more info added here
        var jsonTripCities = {};  // {city1, city2, city3 ..} should be created in the first time only, when create the account, and then just updating.
        var jsonTrip = {};  // {id:1,{general, cities}}
        var jsonMain = {};  //{kareem9k{trips{tripId{general, cities}}}}

        //save all the general information about the trip
        jsonTripGeneralInfo = {
                trip_name: $scope.tripName.text,
                start_date: $scope.dateStart.text,
                end_date: $scope.dateEnd.text,
                continent:'America'
        };

        //save all destination (cities) to json file
        for (var i = 0; i < $scope.destinations.length; i++) {
            jsonTripCities[i] = $scope.destinations[i].city;
        }

        if($scope.newTripId >= 0 ){
            jsonTrip = {'$scope.newTripId':[jsonTripGeneralInfo, jsonTripCities]};
        }else{
            jsonTrip = {'1':{'general':jsonTripGeneralInfo,'cities': jsonTripCities}};
        }


        jsonMain = {"kareem9k":{'trips':jsonTrip}};
        console.log(jsonMain);





      //  console.log(jsonTripData);

        var r = /\d+/;
        var s = event.target.name;
        var cityNumber = s.match(r);


        //save the cities list to data base
        dataBaseService.saveTrip(jsonMain)
            .success(function (data, status, headers, config) {
                //$scope.message = data; //handle data back from server - not needed meanwhile
                console.log(jsonMain);
            })
            .error(function (data, status, headers, config) {
                console.log("failure message: " + JSON.stringify({data: data}));
            });


        //should be fixed according to the new structure
        dataBaseService.getTrip().then(function (results) {
                // Do something with results
                var cities = results.data.cities;
                $scope.geoCode = googleMapsAPIService.createCircles(cities);


                Promise.resolve($scope.geoCode).then(function (val) { // why 3 promises
                    for (var i = 0; i < val.length; i++) {

                        Promise.resolve(val[i]).then(function (val2) {   // recursive behave, first the val[1] then val[0], ask about it?
                            console.log('city: ' + val2.data[0].city);
                            console.log('latitude: ' + val2.data[0].latitude);
                            console.log('longitude: ' + val2.data[0].longitude);

                            console.log('index ' + i);
                            var circle = getTemplate();
                            circle['id'] = Math.floor((Math.random() * 10) + 2);
                            circle['center'].latitude = val2.data[0].latitude;
                            circle['center'].longitude = val2.data[0].longitude;
                            console.log(circle);

                            $scope.circles.push(circle);
                            // circleArray[circleArray.length+1] = circle;

                            console.log($scope.circles);
                            // console.log(circleArray);
                        })
                    }
                })

            }
        );


    };


    $scope.rowCollection = [
        {
            city: 'London',
            flight: 'London Airlines',
            hotel: 'London Hotel',
            car: 'Mercedes SL',
            action1: 'Big Ben'
        },
        {
            city: 'London',
            flight: 'London Airlines',
            hotel: 'London Hotel',
            car: 'Mercedes SL',
            action1: 'Big Ben'
        },
        {
            city: 'London',
            flight: 'London Airlines',
            hotel: 'London Hotel',
            car: 'Mercedes SL',
            action1: 'Big Ben'
        },
        {
            city: 'London',
            flight: 'London Airlines',
            hotel: 'London Hotel',
            car: 'Mercedes SL',
            action1: 'Big Ben'
        },
        {
            city: 'London',
            flight: 'London Airlines',
            hotel: 'London Hotel',
            car: 'Mercedes SL',
            action1: 'Big Ben'
        },
        {
            city: 'London',
            flight: 'London Airlines',
            hotel: 'London Hotel',
            car: 'Mercedes SL',
            action1: 'Big Ben'
        },
        {
            city: 'London',
            flight: 'London Airlines',
            hotel: 'London Hotel',
            car: 'Mercedes SL',
            action1: 'Big Ben'
        },
        {
            city: 'London',
            flight: 'London Airlines',
            hotel: 'London Hotel',
            car: 'Mercedes SL',
            action1: 'Big Ben'
        }

    ];

    // model for bs-table
    //  $scope.contactList = [];

// get contact list
    //   $scope.contactList = SomeService.GetAll();


});