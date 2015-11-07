trackerApp.controller('view1Ctrl' ,function ($scope, $http, googleMapsAPIService, dataBaseService ,messages, NgTableParams) {


    //get trip data to the page
    $scope.trip_id = messages.getTripID();

    if ($scope.trip_id == '') {
        window.open ('#/viewError', '_self', false);
    }
    else {

        var dataTripId = {trip_id: $scope.trip_id};
        dataBaseService.getTripById(dataTripId).then(function (results) {

            $scope.tripById = results.data;

            console.log('Client:: View3:: get trip by id::' + messages.getTripID());
            //exmple for how to get data from results console.log('trip  '+$scope.tripById[0].id);

            //fill all field
            //
            console.log($scope.tripById[0].end_date);
            console.log($scope.tripById[0].start_date);
            console.log($scope.tripById[0].trip_description);

            $scope.tripName = $scope.tripById[0].trip_name;
            $scope.tripDescription = $scope.tripById[0].trip_description;
            $scope.dateStart = $scope.tripById[0].start_date;
            $scope.dateEnd = $scope.tripById[0].end_date;



            if (results.data[0].table_plan) {
                $scope.destinations = []; //clean destinations textboxes

            for (var i = 0; i < results.data[0].table_plan.length; i++) {
                console.log('DELETE MEEEEEE' + results.data[0].table_plan[i]['city' + i]);
                console.log('DELETE MEEEEEE' + results.data[0].table_plan[i]['days' + i]);


                $scope.destinations.push({
                    city: $scope.tripById[0].table_plan[i]['city' + i],
                    days: $scope.tripById[0].table_plan[i]['days' + i]
                });
            }
        }

        });

        dataBaseService.createTable(dataTripId).then(function (results) {
            $scope.table = results.data;
            //$scope.data = [$scope.table[0]];

            //var self = this;
            //var data = [{name: "Moroni", age: 50},{name: "Moroni", age: 50}];
            //self.tableParams = new NgTableParams({}, { dataset: data});


            var itemsArray = [];
            for(var i = 0; i < $scope.table.length ; i++)
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


            console.log('Client:: View3:: Create Table::' +  $scope.table);
            console.log($scope.table.length);
        });


        //########################## Table ####################################




        //#####################################################################



    }



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

    /*

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

        var jsonTripGeneralInfo = {};
        var jsonTripTableCity = {};
        var tableArray = []
        var jsonTrip = {};
        var jsonMain = {};

        var jsonTablePlan = [];

        //save all the general information about the trip
        jsonTripGeneralInfo = {
            trip_id : messages.getTripID(), //internal use for updating
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
            jsonTripTableCity['general' + i] = {flight:'',hotel:'',car:'',action1:'',action2:''};
            tableArray.push(jsonTripTableCity)
            jsonTripTableCity = {};
        }

        jsonTrip = {'general': jsonTripGeneralInfo, 'table_plan': tableArray};

        //jsonMain = {"username":{'trips':jsonTrip}};
        jsonMain = {"username": {'trip': jsonTrip}};

        var r = /\d+/;
        var s = event.target.name;
        var cityNumber = s.match(r);

/*
        //save the cities list to data base
        dataBaseService.saveNewTrip(jsonMain)
            .success(function (data, status, headers, config) {
                //$scope.message = data; //handle data back from server - not needed meanwhile
                console.log(jsonMain);
            })
            .error(function (data, status, headers, config) {
                console.log("failure message: " + JSON.stringify({data: data}));
            });
*/

        //console.log('Client:: Trip Def page :: the trip sent to server:: '+jsonMain['username'].trip.general.trip_name);

        //save the cities list to data base
        dataBaseService.updateTrip(jsonMain)
            .success(function (data, status, headers, config) {
                //$scope.message = data; //handle data back from server - not needed meanwhile
                console.log(jsonMain);
            })
            .error(function (data, status, headers, config) {
                console.log("failure message: " + JSON.stringify({data: data}));
            });





        //build table

        dataBaseService.createTable(dataTripId).then(function (results) {
            $scope.table = results.data;
            //$scope.data = [$scope.table[0]];

            //var self = this;
            //var data = [{name: "Moroni", age: 50},{name: "Moroni", age: 50}];
            //self.tableParams = new NgTableParams({}, { dataset: data});


            var itemsArray = [];
            for(var i = 0; i < $scope.table.length ; i++)
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


            console.log('Client:: View3:: Create Table::' +  $scope.table);
            console.log($scope.table.length);
        });

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