trackerApp.controller('view1Ctrl', function ($scope, $http, $q, $filter, googleMapsAPIService, dataBaseService, algorithmsService, messages, NgTableParams) {

        var dataTripId;
        $scope.polylines = [];
        $scope.circles = [];
        $scope.dates = [];
        $scope.table = {};
        $scope.flights = [];

        //get trip data to the page
        $scope.trip_id = messages.getTripID();

        if ($scope.trip_id == '') {
            window.open('#/viewError', '_self', false);
        }
        else {

            dataTripId = {trip_id: $scope.trip_id};
            dataBaseService.getTripById(dataTripId).then(function (results) {

                $scope.tripById = results.data;

                console.log('Client:: View3:: get trip by id::' + messages.getTripID());
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
                $scope.dates[0] = month + '/' + day + '/' + year;

                for (var i = 1; i < daysSum; i++) {
                    var anotherDay = 1000 * 3600 * (i * 24);
                    //$scope.dates[i] = new Date(dateInNumberFormat + day).toString("MMMM yyyy");

                    var month = new Date(dateInNumberFormat + anotherDay).getUTCMonth() + 1; //months from 1-12
                    var day = new Date(dateInNumberFormat + anotherDay).getUTCDate();
                    var year = new Date(dateInNumberFormat + anotherDay).getUTCFullYear();
                    $scope.dates[i] = month + '/' + day + '/' + year;
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
                        if (i == 0) {
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
                $scope.table = algorithmsService.whenFlightNeeded(results.data); // This alg check weather flight needed and give true
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


//this $scope.userTable --> not sure if required because I'm using $scope.items in the ng repeat
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

                for (var dayIndex = 0; dayIndex < $scope.table.length; dayIndex++) {
                    //  if ($scope.table[dayIndex].flight.flight && dayIndex < $scope.table.length - 1) { // Cancel the check if flight required, better solution needed
                    console.log('damn!!' + $scope.table[dayIndex].flight.flight);
                    if ($scope.table[dayIndex].flight.flight == false) {
                        $scope.flights.push(false); //it means no need to get flith for this day
                    } else {
                        //get flights for this day
                        //get the city name and the dist city name, airport code name required, will be handled later, meanwhile I'm using hardcoded example
                        var flightParam = {
                            origin: $scope.table[dayIndex].city,
                            destination: $scope.table[dayIndex + 1].city,
                            date: "2015-12-30",
                            solutions: 10
                        };
                        console.log(flightParam);


                        // each result of an flight should be handled in a smart algorithm
                        googleMapsAPIService.getFlights(flightParam).success(function (data) {
                                $scope.flights.push(algorithmsService.getFlightsByPrice(data));

                                console.log($scope.flights)
                            })
                            .error(function (data, status) {
                                console.error('error', status, data);
                            })
                            .finally(function () {
                                console.log('finally');
                            });


                    }

                    /*
                     $scope.flights = [
                     [
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD332.76",
                     "id": "8ZeR4yI7hFSLMS7IecALxF001",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 685,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 140,
                     "flight": {
                     "carrier": "TK",
                     "number": "865"
                     },
                     "id": "G4RCBw-tlkM39cSN",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 6,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LHPOkP75eSO+TA7g",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T11:20+02:00",
                     "departureTime": "2015-12-30T09:00+02:00",
                     "origin": "TLV",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 140,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 395
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 150,
                     "flight": {
                     "carrier": "TK",
                     "number": "694"
                     },
                     "id": "GGAMr+2nXXzZ-kpW",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LJdjFgz6miUoMKCS",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T20:25+02:00",
                     "departureTime": "2015-12-30T17:55+02:00",
                     "origin": "IST",
                     "destination": "CAI",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 150,
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AVvxhhXb+KLm1YQnLXnnVJa5RrLnzcTx1oEiXUnzkK/A",
                     "carrier": "TK",
                     "origin": "TLV",
                     "destination": "CAI",
                     "basisCode": "LS1PXOW"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AVvxhhXb+KLm1YQnLXnnVJa5RrLnzcTx1oEiXUnzkK/A",
                     "segmentId": "GGAMr+2nXXzZ-kpW"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AVvxhhXb+KLm1YQnLXnnVJa5RrLnzcTx1oEiXUnzkK/A",
                     "segmentId": "G4RCBw-tlkM39cSN"
                     }
                     ],
                     "baseFareTotal": "USD199.00",
                     "saleFareTotal": "USD199.00",
                     "saleTaxTotal": "USD133.76",
                     "saleTotal": "USD332.76",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD102.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "USD5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV TK X/IST TK CAI 199.00LS1PXOW NUC 199.00 END ROE 1.00 FARE USD 199.00 XT 26.36IL 5.40TR 102.00YR",
                     "latestTicketingTime": "2015-12-30T01:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD462.76",
                     "id": "8ZeR4yI7hFSLMS7IecALxF002",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 470,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 145,
                     "flight": {
                     "carrier": "TK",
                     "number": "795"
                     },
                     "id": "GA0IWvdG-TJ5n8U9",
                     "cabin": "COACH",
                     "bookingCode": "M",
                     "bookingCodeCount": 4,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LJA7MvfNSzKX1moL",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T15:00+02:00",
                     "departureTime": "2015-12-30T12:35+02:00",
                     "origin": "TLV",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 145,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 175
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 150,
                     "flight": {
                     "carrier": "TK",
                     "number": "694"
                     },
                     "id": "GGAMr+2nXXzZ-kpW",
                     "cabin": "COACH",
                     "bookingCode": "V",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LJdjFgz6miUoMKCS",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T20:25+02:00",
                     "departureTime": "2015-12-30T17:55+02:00",
                     "origin": "IST",
                     "destination": "CAI",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 150,
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "carrier": "TK",
                     "origin": "TLV",
                     "destination": "IST",
                     "basisCode": "MLYRT"
                     },
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "ApS9PgHv2ViOIOQd/JQyvxOuvXxWHjgFe+a6JC/Nj6tM",
                     "carrier": "TK",
                     "origin": "IST",
                     "destination": "CAI",
                     "basisCode": "VT1PX6M"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "segmentId": "GA0IWvdG-TJ5n8U9"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "ApS9PgHv2ViOIOQd/JQyvxOuvXxWHjgFe+a6JC/Nj6tM",
                     "segmentId": "GGAMr+2nXXzZ-kpW"
                     }
                     ],
                     "baseFareTotal": "USD329.00",
                     "saleFareTotal": "USD329.00",
                     "saleTaxTotal": "USD133.76",
                     "saleTotal": "USD462.76",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD102.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "USD5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV TK X/IST 249.50MLYRT TK CAI 79.50VT1PX6M NUC 329.00 END ROE 1.00 FARE USD 329.00 XT 26.36IL 5.40TR 102.00YR",
                     "latestTicketingTime": "2015-12-23T23:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD462.76",
                     "id": "8ZeR4yI7hFSLMS7IecALxF006",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 585,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 145,
                     "flight": {
                     "carrier": "TK",
                     "number": "785"
                     },
                     "id": "GrXM7nh4vHEbBXTt",
                     "cabin": "COACH",
                     "bookingCode": "M",
                     "bookingCodeCount": 1,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LGlY9F6+bQ1DgfMD",
                     "aircraft": "32B",
                     "arrivalTime": "2015-12-30T13:05+02:00",
                     "departureTime": "2015-12-30T10:40+02:00",
                     "origin": "TLV",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 145,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 290
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 150,
                     "flight": {
                     "carrier": "TK",
                     "number": "694"
                     },
                     "id": "GGAMr+2nXXzZ-kpW",
                     "cabin": "COACH",
                     "bookingCode": "V",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LJdjFgz6miUoMKCS",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T20:25+02:00",
                     "departureTime": "2015-12-30T17:55+02:00",
                     "origin": "IST",
                     "destination": "CAI",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 150,
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "carrier": "TK",
                     "origin": "TLV",
                     "destination": "IST",
                     "basisCode": "MLYRT"
                     },
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "ApS9PgHv2ViOIOQd/JQyvxOuvXxWHjgFe+a6JC/Nj6tM",
                     "carrier": "TK",
                     "origin": "IST",
                     "destination": "CAI",
                     "basisCode": "VT1PX6M"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "segmentId": "GrXM7nh4vHEbBXTt"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "ApS9PgHv2ViOIOQd/JQyvxOuvXxWHjgFe+a6JC/Nj6tM",
                     "segmentId": "GGAMr+2nXXzZ-kpW"
                     }
                     ],
                     "baseFareTotal": "USD329.00",
                     "saleFareTotal": "USD329.00",
                     "saleTaxTotal": "USD133.76",
                     "saleTotal": "USD462.76",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD102.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "USD5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV TK X/IST 249.50MLYRT TK CAI 79.50VT1PX6M NUC 329.00 END ROE 1.00 FARE USD 329.00 XT 26.36IL 5.40TR 102.00YR",
                     "latestTicketingTime": "2015-12-23T23:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD462.76",
                     "id": "8ZeR4yI7hFSLMS7IecALxF009",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 685,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 150,
                     "flight": {
                     "carrier": "TK",
                     "number": "787"
                     },
                     "id": "GKVKTDckINuZRpJH",
                     "cabin": "COACH",
                     "bookingCode": "M",
                     "bookingCodeCount": 1,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LcNKkfEwAjm+kIs-",
                     "aircraft": "320",
                     "arrivalTime": "2015-12-30T18:05+02:00",
                     "departureTime": "2015-12-30T15:35+02:00",
                     "origin": "TLV",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 150,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 390
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 145,
                     "flight": {
                     "carrier": "TK",
                     "number": "692"
                     },
                     "id": "Gx0Mwb3Yc+dkX2++",
                     "cabin": "COACH",
                     "bookingCode": "V",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LHjJB7QG-Dr6pLv3",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-31T03:00+02:00",
                     "departureTime": "2015-12-31T00:35+02:00",
                     "origin": "IST",
                     "destination": "CAI",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 145,
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "carrier": "TK",
                     "origin": "TLV",
                     "destination": "IST",
                     "basisCode": "MLYRT"
                     },
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "ApS9PgHv2ViOIOQd/JQyvxOuvXxWHjgFe+a6JC/Nj6tM",
                     "carrier": "TK",
                     "origin": "IST",
                     "destination": "CAI",
                     "basisCode": "VT1PX6M"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "ApS9PgHv2ViOIOQd/JQyvxOuvXxWHjgFe+a6JC/Nj6tM",
                     "segmentId": "Gx0Mwb3Yc+dkX2++"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "segmentId": "GKVKTDckINuZRpJH"
                     }
                     ],
                     "baseFareTotal": "USD329.00",
                     "saleFareTotal": "USD329.00",
                     "saleTaxTotal": "USD133.76",
                     "saleTotal": "USD462.76",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD102.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "USD5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV TK X/IST 249.50MLYRT TK CAI 79.50VT1PX6M NUC 329.00 END ROE 1.00 FARE USD 329.00 XT 26.36IL 5.40TR 102.00YR",
                     "latestTicketingTime": "2015-12-23T23:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD462.76",
                     "id": "8ZeR4yI7hFSLMS7IecALxF003",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 380,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 145,
                     "flight": {
                     "carrier": "TK",
                     "number": "789"
                     },
                     "id": "GRI7ws9GCCKn1gJL",
                     "cabin": "COACH",
                     "bookingCode": "M",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LukHcEAclHOFx1Xc",
                     "aircraft": "332",
                     "arrivalTime": "2015-12-30T23:05+02:00",
                     "departureTime": "2015-12-30T20:40+02:00",
                     "origin": "TLV",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 145,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 90
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 145,
                     "flight": {
                     "carrier": "TK",
                     "number": "692"
                     },
                     "id": "Gx0Mwb3Yc+dkX2++",
                     "cabin": "COACH",
                     "bookingCode": "V",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LHjJB7QG-Dr6pLv3",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-31T03:00+02:00",
                     "departureTime": "2015-12-31T00:35+02:00",
                     "origin": "IST",
                     "destination": "CAI",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 145,
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "carrier": "TK",
                     "origin": "TLV",
                     "destination": "IST",
                     "basisCode": "MLYRT"
                     },
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "ApS9PgHv2ViOIOQd/JQyvxOuvXxWHjgFe+a6JC/Nj6tM",
                     "carrier": "TK",
                     "origin": "IST",
                     "destination": "CAI",
                     "basisCode": "VT1PX6M"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "ApS9PgHv2ViOIOQd/JQyvxOuvXxWHjgFe+a6JC/Nj6tM",
                     "segmentId": "Gx0Mwb3Yc+dkX2++"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "segmentId": "GRI7ws9GCCKn1gJL"
                     }
                     ],
                     "baseFareTotal": "USD329.00",
                     "saleFareTotal": "USD329.00",
                     "saleTaxTotal": "USD133.76",
                     "saleTotal": "USD462.76",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD102.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "USD5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV TK X/IST 249.50MLYRT TK CAI 79.50VT1PX6M NUC 329.00 END ROE 1.00 FARE USD 329.00 XT 26.36IL 5.40TR 102.00YR",
                     "latestTicketingTime": "2015-12-23T23:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD492.76",
                     "id": "8ZeR4yI7hFSLMS7IecALxF008",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 625,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 140,
                     "flight": {
                     "carrier": "TK",
                     "number": "865"
                     },
                     "id": "G4RCBw-tlkM39cSN",
                     "cabin": "COACH",
                     "bookingCode": "S",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LHPOkP75eSO+TA7g",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T11:20+02:00",
                     "departureTime": "2015-12-30T09:00+02:00",
                     "origin": "TLV",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 140,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 355
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 130,
                     "flight": {
                     "carrier": "TK",
                     "number": "8062"
                     },
                     "id": "G7qkD15J91lewIvn",
                     "cabin": "COACH",
                     "bookingCode": "E",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LV1ATvnFMFd24hDV",
                     "aircraft": "738",
                     "arrivalTime": "2015-12-30T19:25+02:00",
                     "departureTime": "2015-12-30T17:15+02:00",
                     "origin": "IST",
                     "destination": "CAI",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 130,
                     "operatingDisclosure": "OPERATED BY EGYPTAIR",
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Au26E/+ALS8x3TgYMLTlsDuPItTY9274qwoFr7X1p3Bg",
                     "carrier": "TK",
                     "origin": "TLV",
                     "destination": "IST",
                     "basisCode": "SLY2XEX"
                     },
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "A/E+lAeCd9qjjtSq0StdQNLiNXXbH+0eqbAJnAWZYQwA",
                     "carrier": "TK",
                     "origin": "IST",
                     "destination": "CAI",
                     "basisCode": "ET1XEX"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A/E+lAeCd9qjjtSq0StdQNLiNXXbH+0eqbAJnAWZYQwA",
                     "segmentId": "G7qkD15J91lewIvn"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Au26E/+ALS8x3TgYMLTlsDuPItTY9274qwoFr7X1p3Bg",
                     "segmentId": "G4RCBw-tlkM39cSN"
                     }
                     ],
                     "baseFareTotal": "USD359.00",
                     "saleFareTotal": "USD359.00",
                     "saleTaxTotal": "USD133.76",
                     "saleTotal": "USD492.76",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD102.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "USD5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV TK X/IST 164.50SLY2XEX TK CAI Q35.00 159.50ET1XEX NUC 359.00 END ROE 1.00 FARE USD 359.00 XT 26.36IL 5.40TR 102.00YR",
                     "latestTicketingTime": "2015-12-30T01:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD507.46",
                     "id": "8ZeR4yI7hFSLMS7IecALxF004",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 375,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 45,
                     "flight": {
                     "carrier": "RJ",
                     "number": "343"
                     },
                     "id": "Go7pnoyfmlvL6ZBr",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LFyWYd-6PaqVQjCq",
                     "aircraft": "320",
                     "arrivalTime": "2015-12-30T09:15+02:00",
                     "departureTime": "2015-12-30T08:30+02:00",
                     "origin": "TLV",
                     "destination": "AMM",
                     "originTerminal": "3",
                     "duration": 45,
                     "mileage": 68,
                     "meal": "Refreshments"
                     }
                     ],
                     "connectionDuration": 240
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 90,
                     "flight": {
                     "carrier": "RJ",
                     "number": "503"
                     },
                     "id": "GoQMQ0ZqBxtdMNy2",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 4,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "L9JS4o+s-ifUx2ag",
                     "aircraft": "E95",
                     "arrivalTime": "2015-12-30T14:45+02:00",
                     "departureTime": "2015-12-30T13:15+02:00",
                     "origin": "AMM",
                     "destination": "CAI",
                     "destinationTerminal": "1",
                     "duration": 90,
                     "mileage": 293,
                     "meal": "Refreshments"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AGGw4fUGCaMI0sX7ATH2ntfnQT6aOpqYGvxsNQfgwHoo",
                     "carrier": "RJ",
                     "origin": "TLV",
                     "destination": "CAI",
                     "basisCode": "HLEEIL1"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AGGw4fUGCaMI0sX7ATH2ntfnQT6aOpqYGvxsNQfgwHoo",
                     "segmentId": "GoQMQ0ZqBxtdMNy2"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AGGw4fUGCaMI0sX7ATH2ntfnQT6aOpqYGvxsNQfgwHoo",
                     "segmentId": "Go7pnoyfmlvL6ZBr"
                     }
                     ],
                     "baseFareTotal": "USD414.00",
                     "saleFareTotal": "USD414.00",
                     "saleTaxTotal": "USD93.46",
                     "saleTotal": "USD507.46",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "KJ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "KJ",
                     "country": "JO",
                     "salePrice": "USD6.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD55.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_I",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "USD5.70"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV RJ X/AMM RJ CAI 414.00HLEEIL1 NUC 414.00 END ROE 1.00 FARE USD 414.00 XT 26.36IL 6.40KJ 5.70YQ 55.00YR",
                     "latestTicketingTime": "2015-12-30T01:29-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD522.76",
                     "id": "8ZeR4yI7hFSLMS7IecALxF005",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 375,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 140,
                     "flight": {
                     "carrier": "TK",
                     "number": "865"
                     },
                     "id": "G4RCBw-tlkM39cSN",
                     "cabin": "COACH",
                     "bookingCode": "S",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LHPOkP75eSO+TA7g",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T11:20+02:00",
                     "departureTime": "2015-12-30T09:00+02:00",
                     "origin": "TLV",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 140,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 100
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 135,
                     "flight": {
                     "carrier": "TK",
                     "number": "8060"
                     },
                     "id": "Gas96qS6CesUXfkA",
                     "cabin": "COACH",
                     "bookingCode": "S",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LksIVujVM3N41r96",
                     "aircraft": "738",
                     "arrivalTime": "2015-12-30T15:15+02:00",
                     "departureTime": "2015-12-30T13:00+02:00",
                     "origin": "IST",
                     "destination": "CAI",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 135,
                     "operatingDisclosure": "OPERATED BY EGYPTAIR",
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Au26E/+ALS8x3TgYMLTlsDuPItTY9274qwoFr7X1p3Bg",
                     "carrier": "TK",
                     "origin": "TLV",
                     "destination": "IST",
                     "basisCode": "SLY2XEX"
                     },
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Ay+4XBKelC22YrNXCBHHQ3UFxt04Sv+JRcqf9RSwcIfk",
                     "carrier": "TK",
                     "origin": "IST",
                     "destination": "CAI",
                     "basisCode": "ST1XEX"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Au26E/+ALS8x3TgYMLTlsDuPItTY9274qwoFr7X1p3Bg",
                     "segmentId": "G4RCBw-tlkM39cSN"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Ay+4XBKelC22YrNXCBHHQ3UFxt04Sv+JRcqf9RSwcIfk",
                     "segmentId": "Gas96qS6CesUXfkA"
                     }
                     ],
                     "baseFareTotal": "USD389.00",
                     "saleFareTotal": "USD389.00",
                     "saleTaxTotal": "USD133.76",
                     "saleTotal": "USD522.76",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD102.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "USD5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV TK X/IST 164.50SLY2XEX TK CAI Q35.00 189.50ST1XEX NUC 389.00 END ROE 1.00 FARE USD 389.00 XT 26.36IL 5.40TR 102.00YR",
                     "latestTicketingTime": "2015-12-30T01:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD577.76",
                     "id": "8ZeR4yI7hFSLMS7IecALxF007",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 410,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 145,
                     "flight": {
                     "carrier": "TK",
                     "number": "795"
                     },
                     "id": "GA0IWvdG-TJ5n8U9",
                     "cabin": "COACH",
                     "bookingCode": "M",
                     "bookingCodeCount": 4,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LJA7MvfNSzKX1moL",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T15:00+02:00",
                     "departureTime": "2015-12-30T12:35+02:00",
                     "origin": "TLV",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 145,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 135
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 130,
                     "flight": {
                     "carrier": "TK",
                     "number": "8062"
                     },
                     "id": "G7qkD15J91lewIvn",
                     "cabin": "COACH",
                     "bookingCode": "E",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LV1ATvnFMFd24hDV",
                     "aircraft": "738",
                     "arrivalTime": "2015-12-30T19:25+02:00",
                     "departureTime": "2015-12-30T17:15+02:00",
                     "origin": "IST",
                     "destination": "CAI",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 130,
                     "operatingDisclosure": "OPERATED BY EGYPTAIR",
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "carrier": "TK",
                     "origin": "TLV",
                     "destination": "IST",
                     "basisCode": "MLYRT"
                     },
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "A/E+lAeCd9qjjtSq0StdQNLiNXXbH+0eqbAJnAWZYQwA",
                     "carrier": "TK",
                     "origin": "IST",
                     "destination": "CAI",
                     "basisCode": "ET1XEX"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "segmentId": "GA0IWvdG-TJ5n8U9"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A/E+lAeCd9qjjtSq0StdQNLiNXXbH+0eqbAJnAWZYQwA",
                     "segmentId": "G7qkD15J91lewIvn"
                     }
                     ],
                     "baseFareTotal": "USD444.00",
                     "saleFareTotal": "USD444.00",
                     "saleTaxTotal": "USD133.76",
                     "saleTotal": "USD577.76",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD102.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "USD5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV TK X/IST 249.50MLYRT TK CAI Q35.00 159.50ET1XEX NUC 444.00 END ROE 1.00 FARE USD 444.00 XT 26.36IL 5.40TR 102.00YR",
                     "latestTicketingTime": "2015-12-30T05:34-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "USD577.76",
                     "id": "8ZeR4yI7hFSLMS7IecALxF00A",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 525,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 145,
                     "flight": {
                     "carrier": "TK",
                     "number": "785"
                     },
                     "id": "GrXM7nh4vHEbBXTt",
                     "cabin": "COACH",
                     "bookingCode": "M",
                     "bookingCodeCount": 1,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LGlY9F6+bQ1DgfMD",
                     "aircraft": "32B",
                     "arrivalTime": "2015-12-30T13:05+02:00",
                     "departureTime": "2015-12-30T10:40+02:00",
                     "origin": "TLV",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 145,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 250
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 130,
                     "flight": {
                     "carrier": "TK",
                     "number": "8062"
                     },
                     "id": "G7qkD15J91lewIvn",
                     "cabin": "COACH",
                     "bookingCode": "E",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LV1ATvnFMFd24hDV",
                     "aircraft": "738",
                     "arrivalTime": "2015-12-30T19:25+02:00",
                     "departureTime": "2015-12-30T17:15+02:00",
                     "origin": "IST",
                     "destination": "CAI",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 130,
                     "operatingDisclosure": "OPERATED BY EGYPTAIR",
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "carrier": "TK",
                     "origin": "TLV",
                     "destination": "IST",
                     "basisCode": "MLYRT"
                     },
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "A/E+lAeCd9qjjtSq0StdQNLiNXXbH+0eqbAJnAWZYQwA",
                     "carrier": "TK",
                     "origin": "IST",
                     "destination": "CAI",
                     "basisCode": "ET1XEX"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Ap8ACT4HUZndaPCXvNfNB4tVo1S5C18kUfYLranedqTI",
                     "segmentId": "GrXM7nh4vHEbBXTt"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A/E+lAeCd9qjjtSq0StdQNLiNXXbH+0eqbAJnAWZYQwA",
                     "segmentId": "G7qkD15J91lewIvn"
                     }
                     ],
                     "baseFareTotal": "USD444.00",
                     "saleFareTotal": "USD444.00",
                     "saleTaxTotal": "USD133.76",
                     "saleTotal": "USD577.76",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "USD102.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "USD5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "IL_001",
                     "chargeType": "GOVERNMENT",
                     "code": "IL",
                     "country": "IL",
                     "salePrice": "USD26.36"
                     }
                     ],
                     "fareCalculation": "TLV TK X/IST 249.50MLYRT TK CAI Q35.00 159.50ET1XEX NUC 444.00 END ROE 1.00 FARE USD 444.00 XT 26.36IL 5.40TR 102.00YR",
                     "latestTicketingTime": "2015-12-30T03:39-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     }
                     ],
                     [
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP2566.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF002",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 525,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 75,
                     "flight": {
                     "carrier": "RJ",
                     "number": "508"
                     },
                     "id": "GKG2o3u9ZS8gU1Y5",
                     "cabin": "COACH",
                     "bookingCode": "K",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "L22xIUrRkazfmGb+",
                     "aircraft": "319",
                     "arrivalTime": "2015-12-30T09:15+02:00",
                     "departureTime": "2015-12-30T08:00+02:00",
                     "origin": "CAI",
                     "destination": "AMM",
                     "originTerminal": "1",
                     "duration": 75,
                     "mileage": 293,
                     "meal": "Refreshments"
                     }
                     ],
                     "connectionDuration": 125
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 325,
                     "flight": {
                     "carrier": "RJ",
                     "number": "111"
                     },
                     "id": "Gg0seExflwwmX4ba",
                     "cabin": "COACH",
                     "bookingCode": "K",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LuibJXFMLg4gk0Oo",
                     "aircraft": "787",
                     "arrivalTime": "2015-12-30T14:45+00:00",
                     "departureTime": "2015-12-30T11:20+02:00",
                     "origin": "AMM",
                     "destination": "LHR",
                     "destinationTerminal": "3",
                     "duration": 325,
                     "mileage": 2287,
                     "meal": "Lunch"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "APRmjotwDeC4bTjmwH2I2jy6OnuGYIzwuCtyOVU9TQlU",
                     "carrier": "RJ",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "KLPXEG1"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "APRmjotwDeC4bTjmwH2I2jy6OnuGYIzwuCtyOVU9TQlU",
                     "segmentId": "Gg0seExflwwmX4ba"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "APRmjotwDeC4bTjmwH2I2jy6OnuGYIzwuCtyOVU9TQlU",
                     "segmentId": "GKG2o3u9ZS8gU1Y5"
                     }
                     ],
                     "baseFareTotal": "EGP1140.00",
                     "saleFareTotal": "EGP1140.00",
                     "saleTaxTotal": "EGP1426.00",
                     "saleTotal": "EGP2566.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP87.20"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "KJ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "KJ",
                     "country": "JO",
                     "salePrice": "EGP51.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "EGP77.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP62.80"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "EGP744.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI RJ X/AMM RJ LON 145.62KLPXEG1 NUC 145.62 END ROE 7.82855 FARE EGP 1140.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 51.00KJ 77.00YQ 744.00YR",
                     "latestTicketingTime": "2015-12-30T00:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP3062.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF007",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 765,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 120,
                     "flight": {
                     "carrier": "A3",
                     "number": "1303"
                     },
                     "id": "G4BjeJeVM3mqJYuM",
                     "cabin": "COACH",
                     "bookingCode": "K",
                     "bookingCodeCount": 4,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LCG1HlMeJVdK4XWZ",
                     "aircraft": "738",
                     "arrivalTime": "2015-12-30T12:30+02:00",
                     "departureTime": "2015-12-30T10:30+02:00",
                     "origin": "CAI",
                     "destination": "ATH",
                     "originTerminal": "3",
                     "duration": 120,
                     "operatingDisclosure": "OPERATED BY EGYPTAIR",
                     "mileage": 687
                     }
                     ],
                     "connectionDuration": 400
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 245,
                     "flight": {
                     "carrier": "A3",
                     "number": "608"
                     },
                     "id": "G931VQWWbP6tb+B5",
                     "cabin": "COACH",
                     "bookingCode": "K",
                     "bookingCodeCount": 1,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LgGteNwseB+lnjrz",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T21:15+00:00",
                     "departureTime": "2015-12-30T19:10+02:00",
                     "origin": "ATH",
                     "destination": "LHR",
                     "destinationTerminal": "2",
                     "duration": 245,
                     "mileage": 1507,
                     "meal": "Hot Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AkodgsYrlStBG40oGzS3+UCPpz+ryZY0Ikk3IMmYD1ko",
                     "carrier": "A3",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "K2A3C"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AkodgsYrlStBG40oGzS3+UCPpz+ryZY0Ikk3IMmYD1ko",
                     "segmentId": "G931VQWWbP6tb+B5"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AkodgsYrlStBG40oGzS3+UCPpz+ryZY0Ikk3IMmYD1ko",
                     "segmentId": "G4BjeJeVM3mqJYuM"
                     }
                     ],
                     "baseFareTotal": "EGP2284.00",
                     "saleFareTotal": "EGP2284.00",
                     "saleTaxTotal": "EGP778.00",
                     "saleTotal": "EGP3062.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP146.66"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "EGP52.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP3.34"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "WP_001",
                     "chargeType": "GOVERNMENT",
                     "code": "WP",
                     "country": "GR",
                     "salePrice": "EGP129.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "WQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "WQ",
                     "country": "GR",
                     "salePrice": "EGP43.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI A3 X/ATH Q21.19 A3 LON Q21.19 249.34K2A3C NUC 291.73 END ROE 7.82855 FARE EGP 2284.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 129.00WP 43.00WQ 52.00YQ",
                     "latestTicketingTime": "2015-12-30T03:29-05:00",
                     "ptc": "ADT"
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP3232.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF004",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 420,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 120,
                     "flight": {
                     "carrier": "A3",
                     "number": "1303"
                     },
                     "id": "G4BjeJeVM3mqJYuM",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 4,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LCG1HlMeJVdK4XWZ",
                     "aircraft": "738",
                     "arrivalTime": "2015-12-30T12:30+02:00",
                     "departureTime": "2015-12-30T10:30+02:00",
                     "origin": "CAI",
                     "destination": "ATH",
                     "originTerminal": "3",
                     "duration": 120,
                     "operatingDisclosure": "OPERATED BY EGYPTAIR",
                     "mileage": 687
                     }
                     ],
                     "connectionDuration": 55
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 245,
                     "flight": {
                     "carrier": "A3",
                     "number": "602"
                     },
                     "id": "GehA8jU7W+A9c4Ql",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 1,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "Lk7uXM6QgYu0vsD2",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T15:30+00:00",
                     "departureTime": "2015-12-30T13:25+02:00",
                     "origin": "ATH",
                     "destination": "LHR",
                     "destinationTerminal": "2",
                     "duration": 245,
                     "mileage": 1507,
                     "meal": "Hot Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AshijSOZexthpkMHEL2xIC0hJOTVK/y0E2DKstAckzoI",
                     "carrier": "A3",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "L1A3C"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AshijSOZexthpkMHEL2xIC0hJOTVK/y0E2DKstAckzoI",
                     "segmentId": "GehA8jU7W+A9c4Ql"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AshijSOZexthpkMHEL2xIC0hJOTVK/y0E2DKstAckzoI",
                     "segmentId": "G4BjeJeVM3mqJYuM"
                     }
                     ],
                     "baseFareTotal": "EGP2454.00",
                     "saleFareTotal": "EGP2454.00",
                     "saleTaxTotal": "EGP778.00",
                     "saleTotal": "EGP3232.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP146.88"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "EGP52.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP3.12"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "WP_001",
                     "chargeType": "GOVERNMENT",
                     "code": "WP",
                     "country": "GR",
                     "salePrice": "EGP129.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "WQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "WQ",
                     "country": "GR",
                     "salePrice": "EGP43.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI A3 X/ATH Q21.19 A3 LON Q21.19 271.05L1A3C NUC 313.44 END ROE 7.82855 FARE EGP 2454.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 129.00WP 43.00WQ 52.00YQ",
                     "latestTicketingTime": "2015-12-30T03:29-05:00",
                     "ptc": "ADT"
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP3365.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF001",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 310,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 310,
                     "flight": {
                     "carrier": "MS",
                     "number": "779"
                     },
                     "id": "Gs34h5UwGeazPpcK",
                     "cabin": "COACH",
                     "bookingCode": "Q",
                     "bookingCodeCount": 2,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LRq1K8adpx+hIHPc",
                     "aircraft": "738",
                     "arrivalTime": "2015-12-30T21:00+00:00",
                     "departureTime": "2015-12-30T17:50+02:00",
                     "origin": "CAI",
                     "destination": "LHR",
                     "originTerminal": "3",
                     "destinationTerminal": "2",
                     "duration": 310,
                     "mileage": 2194,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AJLgwf/TGo2kB9FXUKJ1o7yRucV2QrdlvuE9YWZNimTk",
                     "carrier": "MS",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "QREEGO"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AJLgwf/TGo2kB9FXUKJ1o7yRucV2QrdlvuE9YWZNimTk",
                     "segmentId": "Gs34h5UwGeazPpcK"
                     }
                     ],
                     "baseFareTotal": "EGP2329.00",
                     "saleFareTotal": "EGP2329.00",
                     "saleTaxTotal": "EGP1036.00",
                     "saleTotal": "EGP3365.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP124.28"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "EGP462.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP25.72"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_I",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "EGP20.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI MS LON M 297.50QREEGO NUC 297.50 END ROE 7.82855 FARE EGP 2329.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 20.00YQ 462.00YR",
                     "latestTicketingTime": "2015-12-30T10:49-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP3387.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF00A",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 790,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 145,
                     "flight": {
                     "carrier": "TK",
                     "number": "691"
                     },
                     "id": "G8pH6XGWaKXilyDs",
                     "cabin": "COACH",
                     "bookingCode": "S",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LOdBtO-VrJSLjn6L",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T12:15+02:00",
                     "departureTime": "2015-12-30T09:50+02:00",
                     "origin": "CAI",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 145,
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 390
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 255,
                     "flight": {
                     "carrier": "TK",
                     "number": "1983"
                     },
                     "id": "GVjgsAHyRO5LRDEw",
                     "cabin": "COACH",
                     "bookingCode": "S",
                     "bookingCodeCount": 1,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LShfj9uQVTJNmm+O",
                     "aircraft": "32B",
                     "arrivalTime": "2015-12-30T21:00+00:00",
                     "departureTime": "2015-12-30T18:45+02:00",
                     "origin": "IST",
                     "destination": "LHR",
                     "originTerminal": "I",
                     "destinationTerminal": "2",
                     "duration": 255,
                     "mileage": 1561,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AH5N/uc8FDjPOk7FqvXKZmxEpvKPr2HOh8Ggw6o3Z0Jw",
                     "carrier": "TK",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "SS1XOX"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AH5N/uc8FDjPOk7FqvXKZmxEpvKPr2HOh8Ggw6o3Z0Jw",
                     "segmentId": "G8pH6XGWaKXilyDs"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AH5N/uc8FDjPOk7FqvXKZmxEpvKPr2HOh8Ggw6o3Z0Jw",
                     "segmentId": "GVjgsAHyRO5LRDEw"
                     }
                     ],
                     "baseFareTotal": "EGP2100.00",
                     "saleFareTotal": "EGP2100.00",
                     "saleTaxTotal": "EGP1287.00",
                     "saleTotal": "EGP3387.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP112.90"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "EGP690.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP37.10"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "EGP43.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI TK X/IST TK LON 268.24SS1XOX NUC 268.24 END ROE 7.82855 FARE EGP 2100.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 43.00TR 690.00YR",
                     "latestTicketingTime": "2015-12-30T02:49-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP3551.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF005",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 435,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 235,
                     "flight": {
                     "carrier": "OS",
                     "number": "864"
                     },
                     "id": "Gs2bI5E4WbBzAcU6",
                     "cabin": "COACH",
                     "bookingCode": "Q",
                     "bookingCodeCount": 1,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LV4rvYwelR7NBS4Z",
                     "aircraft": "320",
                     "arrivalTime": "2015-12-30T19:05+01:00",
                     "departureTime": "2015-12-30T16:10+02:00",
                     "origin": "CAI",
                     "destination": "VIE",
                     "originTerminal": "3",
                     "duration": 235,
                     "mileage": 1468,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 60
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 140,
                     "flight": {
                     "carrier": "OS",
                     "number": "457"
                     },
                     "id": "GeQseEWICXRPdxHf",
                     "cabin": "COACH",
                     "bookingCode": "Q",
                     "bookingCodeCount": 1,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LN+W-CnZPq27IbrJ",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T21:25+00:00",
                     "departureTime": "2015-12-30T20:05+01:00",
                     "origin": "VIE",
                     "destination": "LHR",
                     "destinationTerminal": "2",
                     "duration": 140,
                     "mileage": 792,
                     "meal": "Snack or Brunch"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AJq9g16He6G63O4rGgC6p6fA+B6eoZ5ZcxeGx1R3eSJA",
                     "carrier": "OS",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "QRFEGOW"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AJq9g16He6G63O4rGgC6p6fA+B6eoZ5ZcxeGx1R3eSJA",
                     "segmentId": "Gs2bI5E4WbBzAcU6"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AJq9g16He6G63O4rGgC6p6fA+B6eoZ5ZcxeGx1R3eSJA",
                     "segmentId": "GeQseEWICXRPdxHf"
                     }
                     ],
                     "baseFareTotal": "EGP1953.00",
                     "saleFareTotal": "EGP1953.00",
                     "saleTaxTotal": "EGP1598.00",
                     "saleTotal": "EGP3551.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP105.76"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "ZY_001",
                     "chargeType": "GOVERNMENT",
                     "code": "ZY",
                     "country": "AT",
                     "salePrice": "EGP156.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "AT_001",
                     "chargeType": "GOVERNMENT",
                     "code": "AT",
                     "country": "AT",
                     "salePrice": "EGP71.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_I",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "EGP681.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP44.24"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_I",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "EGP136.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI OS X/VIE OS LON 249.47QRFEGOW NUC 249.47 END ROE 7.82855 FARE EGP 1953.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 71.00AT 156.00ZY 681.00YQ 136.00YR",
                     "latestTicketingTime": "2015-12-30T09:09-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP3733.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF006",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 525,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 250,
                     "flight": {
                     "carrier": "LX",
                     "number": "237"
                     },
                     "id": "G27phSC6jMUT2JVD",
                     "cabin": "COACH",
                     "bookingCode": "Q",
                     "bookingCodeCount": 5,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LYO5QGvy8Uq5BO7z",
                     "aircraft": "320",
                     "arrivalTime": "2015-12-30T18:05+01:00",
                     "departureTime": "2015-12-30T14:55+02:00",
                     "origin": "CAI",
                     "destination": "ZRH",
                     "originTerminal": "3",
                     "duration": 250,
                     "mileage": 1704,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 165
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 110,
                     "flight": {
                     "carrier": "LX",
                     "number": "340"
                     },
                     "id": "GBbBLuP9lgHorNjM",
                     "cabin": "COACH",
                     "bookingCode": "Q",
                     "bookingCodeCount": 5,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LlP9nSSAh-Nj3KZS",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T21:40+00:00",
                     "departureTime": "2015-12-30T20:50+01:00",
                     "origin": "ZRH",
                     "destination": "LHR",
                     "destinationTerminal": "2",
                     "duration": 110,
                     "mileage": 489,
                     "meal": "Snack or Brunch"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AxP3SKM1jaaAgEx10q5N/B2SCB6Qel5BC6pFIeIQMjuI",
                     "carrier": "LX",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "QRCOWEG"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AxP3SKM1jaaAgEx10q5N/B2SCB6Qel5BC6pFIeIQMjuI",
                     "segmentId": "GBbBLuP9lgHorNjM"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AxP3SKM1jaaAgEx10q5N/B2SCB6Qel5BC6pFIeIQMjuI",
                     "segmentId": "G27phSC6jMUT2JVD"
                     }
                     ],
                     "baseFareTotal": "EGP2213.00",
                     "saleFareTotal": "EGP2213.00",
                     "saleTaxTotal": "EGP1520.00",
                     "saleTotal": "EGP3733.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP109.56"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_I",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "EGP681.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP40.44"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "CH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "CH",
                     "country": "CH",
                     "salePrice": "EGP149.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_I",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "EGP136.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI LX X/ZRH LX LON 282.68QRCOWEG NUC 282.68 END ROE 7.82855 FARE EGP 2213.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 149.00CH 681.00YQ 136.00YR",
                     "latestTicketingTime": "2015-12-30T07:54-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP3746.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF003",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 325,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 325,
                     "flight": {
                     "carrier": "MS",
                     "number": "777"
                     },
                     "id": "GA7jzd1SM2kJ7RUw",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "L0qAQHaBtOcznzVD",
                     "aircraft": "773",
                     "arrivalTime": "2015-12-30T12:35+00:00",
                     "departureTime": "2015-12-30T09:10+02:00",
                     "origin": "CAI",
                     "destination": "LHR",
                     "originTerminal": "3",
                     "destinationTerminal": "2",
                     "duration": 325,
                     "mileage": 2194,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "ALXjt5TKkO01A6tsYG8mMtkVBfk0Octq8VrmPDLRlGQQ",
                     "carrier": "MS",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "HREEGO"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "ALXjt5TKkO01A6tsYG8mMtkVBfk0Octq8VrmPDLRlGQQ",
                     "segmentId": "GA7jzd1SM2kJ7RUw"
                     }
                     ],
                     "baseFareTotal": "EGP2710.00",
                     "saleFareTotal": "EGP2710.00",
                     "saleTaxTotal": "EGP1036.00",
                     "saleTotal": "EGP3746.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP127.35"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "EGP462.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP22.65"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_I",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "EGP20.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI MS LON M 346.16HREEGO NUC 346.16 END ROE 7.82855 FARE EGP 2710.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 20.00YQ 462.00YR",
                     "latestTicketingTime": "2015-12-30T02:09-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP3867.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF008",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 525,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 145,
                     "flight": {
                     "carrier": "TK",
                     "number": "691"
                     },
                     "id": "G8pH6XGWaKXilyDs",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LOdBtO-VrJSLjn6L",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T12:15+02:00",
                     "departureTime": "2015-12-30T09:50+02:00",
                     "origin": "CAI",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 145,
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 130
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 250,
                     "flight": {
                     "carrier": "TK",
                     "number": "1971"
                     },
                     "id": "GlaZH5Qe5jhOUJ6F",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 3,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LF5ByOhR0G2pA6LN",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T16:35+00:00",
                     "departureTime": "2015-12-30T14:25+02:00",
                     "origin": "IST",
                     "destination": "LHR",
                     "originTerminal": "I",
                     "destinationTerminal": "2",
                     "duration": 250,
                     "mileage": 1561,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "A5sTc9SKqrqNB4zb0bV6RdHmf2aBHhIaa8HpiinUmvGo",
                     "carrier": "TK",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "HS1XOX"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A5sTc9SKqrqNB4zb0bV6RdHmf2aBHhIaa8HpiinUmvGo",
                     "segmentId": "G8pH6XGWaKXilyDs"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A5sTc9SKqrqNB4zb0bV6RdHmf2aBHhIaa8HpiinUmvGo",
                     "segmentId": "GlaZH5Qe5jhOUJ6F"
                     }
                     ],
                     "baseFareTotal": "EGP2580.00",
                     "saleFareTotal": "EGP2580.00",
                     "saleTaxTotal": "EGP1287.00",
                     "saleTotal": "EGP3867.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP118.35"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "EGP690.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP31.65"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "EGP43.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI TK X/IST TK LON 329.56HS1XOX NUC 329.56 END ROE 7.82855 FARE EGP 2580.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 43.00TR 690.00YR",
                     "latestTicketingTime": "2015-12-30T02:49-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "EGP3867.00",
                     "id": "Df6WCntZnsRM5MHLu2ecoF009",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 485,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 140,
                     "flight": {
                     "carrier": "TK",
                     "number": "693"
                     },
                     "id": "GTjqwqDBtsVunq99",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LLB1mfdT2V+CsqTa",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T06:20+02:00",
                     "departureTime": "2015-12-30T04:00+02:00",
                     "origin": "CAI",
                     "destination": "IST",
                     "originTerminal": "3",
                     "destinationTerminal": "I",
                     "duration": 140,
                     "mileage": 763,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 90
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 255,
                     "flight": {
                     "carrier": "TK",
                     "number": "1979"
                     },
                     "id": "GxlnPaLAWOYdwOhL",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 5,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LcSP8IPmgAy2tM6L",
                     "aircraft": "333",
                     "arrivalTime": "2015-12-30T10:05+00:00",
                     "departureTime": "2015-12-30T07:50+02:00",
                     "origin": "IST",
                     "destination": "LHR",
                     "originTerminal": "I",
                     "destinationTerminal": "2",
                     "duration": 255,
                     "mileage": 1561,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "A5sTc9SKqrqNB4zb0bV6RdHmf2aBHhIaa8HpiinUmvGo",
                     "carrier": "TK",
                     "origin": "CAI",
                     "destination": "LON",
                     "basisCode": "HS1XOX"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A5sTc9SKqrqNB4zb0bV6RdHmf2aBHhIaa8HpiinUmvGo",
                     "segmentId": "GxlnPaLAWOYdwOhL"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A5sTc9SKqrqNB4zb0bV6RdHmf2aBHhIaa8HpiinUmvGo",
                     "segmentId": "GTjqwqDBtsVunq99"
                     }
                     ],
                     "baseFareTotal": "EGP2580.00",
                     "saleFareTotal": "EGP2580.00",
                     "saleTaxTotal": "EGP1287.00",
                     "saleTotal": "EGP3867.00",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP118.35"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "EGP690.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "XK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "XK",
                     "country": "EG",
                     "salePrice": "EGP31.65"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "EGP43.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QH_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QH",
                     "country": "EG",
                     "salePrice": "EGP196.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EQ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "EQ",
                     "country": "EG",
                     "salePrice": "EGP8.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JK_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JK",
                     "country": "EG",
                     "salePrice": "EGP50.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "EG_002",
                     "chargeType": "GOVERNMENT",
                     "code": "EG",
                     "country": "EG",
                     "salePrice": "EGP150.00"
                     }
                     ],
                     "fareCalculation": "CAI TK X/IST TK LON 329.56HS1XOX NUC 329.56 END ROE 7.82855 FARE EGP 2580.00 XT 150.00EG 8.00EQ 50.00JK 196.00QH 150.00XK 43.00TR 690.00YR",
                     "latestTicketingTime": "2015-12-29T20:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     }
                     ],
                     [
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP236.81",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH006",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 880,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 135,
                     "flight": {
                     "carrier": "IB",
                     "number": "5103"
                     },
                     "id": "GCrYi1glAMWowOu9",
                     "cabin": "COACH",
                     "bookingCode": "Q",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LI99FE4pz9JQHIVr",
                     "aircraft": "320",
                     "arrivalTime": "2015-12-30T15:40+01:00",
                     "departureTime": "2015-12-30T12:25+00:00",
                     "origin": "LHR",
                     "destination": "BCN",
                     "originTerminal": "3",
                     "destinationTerminal": "1",
                     "duration": 135,
                     "operatingDisclosure": "OPERATED BY VUELING AIRLINES",
                     "mileage": 713,
                     "meal": "Food and Beverages for Purchase"
                     }
                     ],
                     "connectionDuration": 495
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 250,
                     "flight": {
                     "carrier": "IB",
                     "number": "5918"
                     },
                     "id": "GtD7Yh9zh8uEt46g",
                     "cabin": "COACH",
                     "bookingCode": "Q",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LmwavtNtjBw65LQn",
                     "aircraft": "320",
                     "arrivalTime": "2015-12-31T05:05+02:00",
                     "departureTime": "2015-12-30T23:55+01:00",
                     "origin": "BCN",
                     "destination": "TLV",
                     "originTerminal": "1",
                     "destinationTerminal": "3",
                     "duration": 250,
                     "operatingDisclosure": "OPERATED BY VUELING AIRLINES",
                     "mileage": 1913,
                     "meal": "Food and Beverages for Purchase"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "A1/5g8S+kDqc1SWF7FXREuYkzRXw5H3L/CGFwzy7biBsg27U20CqBbK5Z1HP8lmwKLmmKhPMCVOxAf3Y9rLWmMFHsjWNvyo",
                     "carrier": "IB",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "QWYNVY"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A1/5g8S+kDqc1SWF7FXREuYkzRXw5H3L/CGFwzy7biBsg27U20CqBbK5Z1HP8lmwKLmmKhPMCVOxAf3Y9rLWmMFHsjWNvyo",
                     "segmentId": "GtD7Yh9zh8uEt46g"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A1/5g8S+kDqc1SWF7FXREuYkzRXw5H3L/CGFwzy7biBsg27U20CqBbK5Z1HP8lmwKLmmKhPMCVOxAf3Y9rLWmMFHsjWNvyo",
                     "segmentId": "GCrYi1glAMWowOu9"
                     }
                     ],
                     "baseFareTotal": "GBP100.00",
                     "saleFareTotal": "GBP100.00",
                     "saleTaxTotal": "GBP136.81",
                     "saleTotal": "GBP236.81",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "JD_001",
                     "chargeType": "GOVERNMENT",
                     "code": "JD",
                     "country": "ES",
                     "salePrice": "GBP8.90"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "QV_001",
                     "chargeType": "GOVERNMENT",
                     "code": "QV",
                     "country": "ES",
                     "salePrice": "GBP1.80"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "OG_001",
                     "chargeType": "GOVERNMENT",
                     "code": "OG",
                     "country": "ES",
                     "salePrice": "GBP0.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_I",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "GBP23.90"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP30.11"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_I",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "GBP0.70"
                     }
                     ],
                     "fareCalculation": "LON IB X/BCN IB TLV 153.62QWYNVY NUC 153.62 END ROE 0.652504 FARE GBP 100.00 XT 71.00GB 30.11UB 8.90JD 0.40OG 1.80QV 23.90YQ 0.70YR",
                     "latestTicketingTime": "2015-12-21T19:31-05:00",
                     "ptc": "ADT"
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP275.01",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH002",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 615,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 75,
                     "flight": {
                     "carrier": "KL",
                     "number": "1012"
                     },
                     "id": "GGlF2awkY9VqThqq",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 5,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LkHZkA4NRmPaFXN7",
                     "aircraft": "E90",
                     "arrivalTime": "2015-12-30T16:20+01:00",
                     "departureTime": "2015-12-30T14:05+00:00",
                     "origin": "LHR",
                     "destination": "AMS",
                     "originTerminal": "4",
                     "duration": 75,
                     "operatingDisclosure": "OPERATED BY KLM CITYHOPPER",
                     "mileage": 229,
                     "meal": "Snack or Brunch"
                     }
                     ],
                     "connectionDuration": 270
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 270,
                     "flight": {
                     "carrier": "KL",
                     "number": "461"
                     },
                     "id": "GV8SB-BN7hExm8hM",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 5,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "Ld-AOaKElGYymRse",
                     "aircraft": "73J",
                     "arrivalTime": "2015-12-31T02:20+02:00",
                     "departureTime": "2015-12-30T20:50+01:00",
                     "origin": "AMS",
                     "destination": "TLV",
                     "destinationTerminal": "3",
                     "duration": 270,
                     "mileage": 2057,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                     "carrier": "KL",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "L7WKWGB3"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                     "segmentId": "GV8SB-BN7hExm8hM"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                     "segmentId": "GGlF2awkY9VqThqq"
                     }
                     ],
                     "baseFareTotal": "GBP164.00",
                     "saleFareTotal": "GBP164.00",
                     "saleTaxTotal": "GBP111.01",
                     "saleTotal": "GBP275.01",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP30.11"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "CJ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "CJ",
                     "country": "NL",
                     "salePrice": "GBP4.90"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "VV_001",
                     "chargeType": "GOVERNMENT",
                     "code": "VV",
                     "country": "NL",
                     "salePrice": "GBP0.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "RN_001",
                     "chargeType": "GOVERNMENT",
                     "code": "RN",
                     "country": "NL",
                     "salePrice": "GBP4.60"
                     }
                     ],
                     "fareCalculation": "LON KL X/AMS KL TLV 251.33L7WKWGB3 NUC 251.33 END ROE 0.652504 FARE GBP 164.00 XT 71.00GB 30.11UB 4.90CJ 4.60RN 0.40VV",
                     "latestTicketingTime": "2015-12-21T19:31-05:00",
                     "ptc": "ADT"
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP275.01",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH008",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 860,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 85,
                     "flight": {
                     "carrier": "KL",
                     "number": "1008"
                     },
                     "id": "GaxYFs6YJ3i4JNgi",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 3,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LyOCq14WZVzjXQMx",
                     "aircraft": "73H",
                     "arrivalTime": "2015-12-30T12:25+01:00",
                     "departureTime": "2015-12-30T10:00+00:00",
                     "origin": "LHR",
                     "destination": "AMS",
                     "originTerminal": "4",
                     "duration": 85,
                     "mileage": 229,
                     "meal": "Snack or Brunch"
                     }
                     ],
                     "connectionDuration": 505
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 270,
                     "flight": {
                     "carrier": "KL",
                     "number": "461"
                     },
                     "id": "GV8SB-BN7hExm8hM",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 3,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "Ld-AOaKElGYymRse",
                     "aircraft": "73J",
                     "arrivalTime": "2015-12-31T02:20+02:00",
                     "departureTime": "2015-12-30T20:50+01:00",
                     "origin": "AMS",
                     "destination": "TLV",
                     "destinationTerminal": "3",
                     "duration": 270,
                     "mileage": 2057,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                     "carrier": "KL",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "L7WKWGB3"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                     "segmentId": "GaxYFs6YJ3i4JNgi"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AXUYazfQHmZMpu9xFL2thOGYsl4Hsz4n6tRN4Pp+4UdI",
                     "segmentId": "GV8SB-BN7hExm8hM"
                     }
                     ],
                     "baseFareTotal": "GBP164.00",
                     "saleFareTotal": "GBP164.00",
                     "saleTaxTotal": "GBP111.01",
                     "saleTotal": "GBP275.01",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP30.11"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "CJ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "CJ",
                     "country": "NL",
                     "salePrice": "GBP4.90"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "VV_001",
                     "chargeType": "GOVERNMENT",
                     "code": "VV",
                     "country": "NL",
                     "salePrice": "GBP0.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "RN_001",
                     "chargeType": "GOVERNMENT",
                     "code": "RN",
                     "country": "NL",
                     "salePrice": "GBP4.60"
                     }
                     ],
                     "fareCalculation": "LON KL X/AMS KL TLV 251.33L7WKWGB3 NUC 251.33 END ROE 0.652504 FARE GBP 164.00 XT 71.00GB 30.11UB 4.90CJ 4.60RN 0.40VV",
                     "latestTicketingTime": "2015-12-21T19:31-05:00",
                     "ptc": "ADT"
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP300.36",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH001",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 455,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 235,
                     "flight": {
                     "carrier": "TK",
                     "number": "1980"
                     },
                     "id": "GVnKKbf5UTm9OeVs",
                     "cabin": "COACH",
                     "bookingCode": "E",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LmV-PO9ZVjAo9li3",
                     "aircraft": "333",
                     "arrivalTime": "2015-12-30T17:35+02:00",
                     "departureTime": "2015-12-30T11:40+00:00",
                     "origin": "LHR",
                     "destination": "IST",
                     "originTerminal": "2",
                     "destinationTerminal": "I",
                     "duration": 235,
                     "mileage": 1561,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 95
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 125,
                     "flight": {
                     "carrier": "TK",
                     "number": "864"
                     },
                     "id": "GIneHYx0LHKJBtvd",
                     "cabin": "COACH",
                     "bookingCode": "E",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LYbUlYtIw4ny2kGe",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T21:15+02:00",
                     "departureTime": "2015-12-30T19:10+02:00",
                     "origin": "IST",
                     "destination": "TLV",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 125,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                     "carrier": "TK",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "EN2PXOW"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                     "segmentId": "GVnKKbf5UTm9OeVs"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                     "segmentId": "GIneHYx0LHKJBtvd"
                     }
                     ],
                     "baseFareTotal": "GBP127.00",
                     "saleFareTotal": "GBP127.00",
                     "saleTaxTotal": "GBP173.36",
                     "saleTotal": "GBP300.36",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "GBP3.60"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "GBP56.70"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP42.06"
                     }
                     ],
                     "fareCalculation": "LON TK X/IST TK TLV 194.63EN2PXOW NUC 194.63 END ROE 0.652504 FARE GBP 127.00 XT 71.00GB 42.06UB 3.60TR 56.70YR",
                     "latestTicketingTime": "2015-12-27T23:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP300.36",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH004",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 680,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 235,
                     "flight": {
                     "carrier": "TK",
                     "number": "1988"
                     },
                     "id": "G7fAzcJdZmRz+jIm",
                     "cabin": "COACH",
                     "bookingCode": "E",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LaSx-geQXBwr+2vV",
                     "aircraft": "32B",
                     "arrivalTime": "2015-12-30T13:50+02:00",
                     "departureTime": "2015-12-30T07:55+00:00",
                     "origin": "LHR",
                     "destination": "IST",
                     "originTerminal": "2",
                     "destinationTerminal": "I",
                     "duration": 235,
                     "mileage": 1561,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 320
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 125,
                     "flight": {
                     "carrier": "TK",
                     "number": "864"
                     },
                     "id": "GIneHYx0LHKJBtvd",
                     "cabin": "COACH",
                     "bookingCode": "E",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LYbUlYtIw4ny2kGe",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-30T21:15+02:00",
                     "departureTime": "2015-12-30T19:10+02:00",
                     "origin": "IST",
                     "destination": "TLV",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 125,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                     "carrier": "TK",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "EN2PXOW"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                     "segmentId": "G7fAzcJdZmRz+jIm"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "Adxzl8m931nIX2mLJMtugyQxAu4EgFq/L4V9gr1n681M",
                     "segmentId": "GIneHYx0LHKJBtvd"
                     }
                     ],
                     "baseFareTotal": "GBP127.00",
                     "saleFareTotal": "GBP127.00",
                     "saleTaxTotal": "GBP173.36",
                     "saleTotal": "GBP300.36",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "GBP3.60"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "GBP56.70"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP42.06"
                     }
                     ],
                     "fareCalculation": "LON TK X/IST TK TLV 194.63EN2PXOW NUC 194.63 END ROE 0.652504 FARE GBP 127.00 XT 71.00GB 42.06UB 3.60TR 56.70YR",
                     "latestTicketingTime": "2015-12-27T23:59-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP318.01",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH00A",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 755,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 80,
                     "flight": {
                     "carrier": "KL",
                     "number": "1010"
                     },
                     "id": "G714dbzwgO88ScSj",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 3,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "L4LzhaHuOSFJfPiH",
                     "aircraft": "73W",
                     "arrivalTime": "2015-12-30T14:05+01:00",
                     "departureTime": "2015-12-30T11:45+00:00",
                     "origin": "LHR",
                     "destination": "AMS",
                     "originTerminal": "4",
                     "duration": 80,
                     "mileage": 229,
                     "meal": "Snack or Brunch"
                     }
                     ],
                     "connectionDuration": 405
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 270,
                     "flight": {
                     "carrier": "KL",
                     "number": "461"
                     },
                     "id": "GV8SB-BN7hExm8hM",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 3,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "Ld-AOaKElGYymRse",
                     "aircraft": "73J",
                     "arrivalTime": "2015-12-31T02:20+02:00",
                     "departureTime": "2015-12-30T20:50+01:00",
                     "origin": "AMS",
                     "destination": "TLV",
                     "destinationTerminal": "3",
                     "duration": 270,
                     "mileage": 2057,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AVz9Z5DOqBQKkVQUTvePd059rsfUv9vmJ1tXzMvJh0xs",
                     "carrier": "KL",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "H7WKWGB3"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AVz9Z5DOqBQKkVQUTvePd059rsfUv9vmJ1tXzMvJh0xs",
                     "segmentId": "GV8SB-BN7hExm8hM"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AVz9Z5DOqBQKkVQUTvePd059rsfUv9vmJ1tXzMvJh0xs",
                     "segmentId": "G714dbzwgO88ScSj"
                     }
                     ],
                     "baseFareTotal": "GBP207.00",
                     "saleFareTotal": "GBP207.00",
                     "saleTaxTotal": "GBP111.01",
                     "saleTotal": "GBP318.01",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP30.11"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "CJ_001",
                     "chargeType": "GOVERNMENT",
                     "code": "CJ",
                     "country": "NL",
                     "salePrice": "GBP4.90"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "VV_001",
                     "chargeType": "GOVERNMENT",
                     "code": "VV",
                     "country": "NL",
                     "salePrice": "GBP0.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "RN_001",
                     "chargeType": "GOVERNMENT",
                     "code": "RN",
                     "country": "NL",
                     "salePrice": "GBP4.60"
                     }
                     ],
                     "fareCalculation": "LON KL X/AMS KL TLV 317.23H7WKWGB3 NUC 317.23 END ROE 0.652504 FARE GBP 207.00 XT 71.00GB 30.11UB 4.90CJ 4.60RN 0.40VV",
                     "latestTicketingTime": "2015-12-30T06:44-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP355.36",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH009",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 670,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 235,
                     "flight": {
                     "carrier": "TK",
                     "number": "1980"
                     },
                     "id": "GVnKKbf5UTm9OeVs",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LmV-PO9ZVjAo9li3",
                     "aircraft": "333",
                     "arrivalTime": "2015-12-30T17:35+02:00",
                     "departureTime": "2015-12-30T11:40+00:00",
                     "origin": "LHR",
                     "destination": "IST",
                     "originTerminal": "2",
                     "destinationTerminal": "I",
                     "duration": 235,
                     "mileage": 1561,
                     "meal": "Meal"
                     }
                     ],
                     "connectionDuration": 310
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 125,
                     "flight": {
                     "carrier": "TK",
                     "number": "810"
                     },
                     "id": "GQaopRCWxzfg+7NL",
                     "cabin": "COACH",
                     "bookingCode": "H",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LBBdh026qMKnIOKT",
                     "aircraft": "321",
                     "arrivalTime": "2015-12-31T00:50+02:00",
                     "departureTime": "2015-12-30T22:45+02:00",
                     "origin": "IST",
                     "destination": "TLV",
                     "originTerminal": "I",
                     "destinationTerminal": "3",
                     "duration": 125,
                     "mileage": 704,
                     "meal": "Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "ALpARxvgnuNIq4hwoH5vEYyVh5WSHYoe6wNpvJuLv7h2",
                     "carrier": "TK",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "HN2XOX"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "ALpARxvgnuNIq4hwoH5vEYyVh5WSHYoe6wNpvJuLv7h2",
                     "segmentId": "GVnKKbf5UTm9OeVs"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "ALpARxvgnuNIq4hwoH5vEYyVh5WSHYoe6wNpvJuLv7h2",
                     "segmentId": "GQaopRCWxzfg+7NL"
                     }
                     ],
                     "baseFareTotal": "GBP182.00",
                     "saleFareTotal": "GBP182.00",
                     "saleTaxTotal": "GBP173.36",
                     "saleTotal": "GBP355.36",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "TR_001",
                     "chargeType": "GOVERNMENT",
                     "code": "TR",
                     "country": "TR",
                     "salePrice": "GBP3.60"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YR_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YR",
                     "salePrice": "GBP56.70"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP42.06"
                     }
                     ],
                     "fareCalculation": "LON TK X/IST TK TLV 278.92HN2XOX NUC 278.92 END ROE 0.652504 FARE GBP 182.00 XT 71.00GB 42.06UB 3.60TR 56.70YR",
                     "latestTicketingTime": "2015-12-30T06:39-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP378.11",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH007",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 410,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 110,
                     "flight": {
                     "carrier": "AB",
                     "number": "5006"
                     },
                     "id": "GEU9fblnGizpBr9S",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 1,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "Lq4g2UzRT0uroikZ",
                     "aircraft": "32A",
                     "arrivalTime": "2015-12-30T21:25+01:00",
                     "departureTime": "2015-12-30T18:35+00:00",
                     "origin": "LHR",
                     "destination": "TXL",
                     "originTerminal": "5",
                     "duration": 110,
                     "operatingDisclosure": "OPERATED BY BRITISH AIRWAYS",
                     "mileage": 588,
                     "meal": "Snack or Brunch"
                     }
                     ],
                     "connectionDuration": 60
                     },
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 240,
                     "flight": {
                     "carrier": "AB",
                     "number": "8380"
                     },
                     "id": "G4ic9MLL33mOyIkj",
                     "cabin": "COACH",
                     "bookingCode": "L",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "1",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LP8v5kIeXOajRLPX",
                     "aircraft": "738",
                     "arrivalTime": "2015-12-31T03:25+02:00",
                     "departureTime": "2015-12-30T22:25+01:00",
                     "origin": "TXL",
                     "destination": "TLV",
                     "destinationTerminal": "3",
                     "duration": 240,
                     "mileage": 1783,
                     "meal": "Snack or Brunch"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "AkTe1cUpydenbavugThqmdH1Ya9lE8SAHxThaMKlmZ4/",
                     "carrier": "AB",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "LRCOW"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AkTe1cUpydenbavugThqmdH1Ya9lE8SAHxThaMKlmZ4/",
                     "segmentId": "G4ic9MLL33mOyIkj"
                     },
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "AkTe1cUpydenbavugThqmdH1Ya9lE8SAHxThaMKlmZ4/",
                     "segmentId": "GEU9fblnGizpBr9S"
                     }
                     ],
                     "baseFareTotal": "GBP226.00",
                     "saleFareTotal": "GBP226.00",
                     "saleTaxTotal": "GBP152.11",
                     "saleTotal": "GBP378.11",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "DE_001",
                     "chargeType": "GOVERNMENT",
                     "code": "DE",
                     "country": "DE",
                     "salePrice": "GBP4.30"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "RA_002",
                     "chargeType": "GOVERNMENT",
                     "code": "RA",
                     "country": "DE",
                     "salePrice": "GBP7.50"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "YQ_F",
                     "chargeType": "CARRIER_SURCHARGE",
                     "code": "YQ",
                     "salePrice": "GBP39.20"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP30.11"
                     }
                     ],
                     "fareCalculation": "LON AB X/BER AB TLV M 346.35LRCOW NUC 346.35 END ROE 0.652504 FARE GBP 226.00 XT 71.00GB 30.11UB 4.30DE 7.50RA 39.20YQ",
                     "latestTicketingTime": "2015-12-22T19:31-05:00",
                     "ptc": "ADT",
                     "refundable": true
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP438.46",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH003",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 290,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 290,
                     "flight": {
                     "carrier": "LY",
                     "number": "316"
                     },
                     "id": "GaIcvkkdooheV6Ey",
                     "cabin": "COACH",
                     "bookingCode": "Q",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LrfNv4IGFj88P2qH",
                     "aircraft": "744",
                     "arrivalTime": "2015-12-30T21:10+02:00",
                     "departureTime": "2015-12-30T14:20+00:00",
                     "origin": "LHR",
                     "destination": "TLV",
                     "originTerminal": "4",
                     "destinationTerminal": "3",
                     "duration": 290,
                     "mileage": 2229,
                     "meal": "Hot Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "A2KEtNzgO42eMzX0QHy43cCvfIx7pKiPtFg+hb9r4NpY",
                     "carrier": "LY",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "QUKOW"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A2KEtNzgO42eMzX0QHy43cCvfIx7pKiPtFg+hb9r4NpY",
                     "segmentId": "GaIcvkkdooheV6Ey"
                     }
                     ],
                     "baseFareTotal": "GBP320.00",
                     "saleFareTotal": "GBP320.00",
                     "saleTaxTotal": "GBP118.46",
                     "saleTotal": "GBP438.46",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "AP_001",
                     "chargeType": "GOVERNMENT",
                     "code": "AP",
                     "country": "IL",
                     "salePrice": "GBP5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP42.06"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     }
                     ],
                     "fareCalculation": "LON LY TLV Q99.61 M 390.80QUKOW NUC 490.41 END ROE 0.652504 FARE GBP 320.00 XT 71.00GB 42.06UB 5.40AP",
                     "latestTicketingTime": "2015-12-30T09:19-05:00",
                     "ptc": "ADT"
                     }
                     ]
                     },
                     {
                     "kind": "qpxexpress#tripOption",
                     "saleTotal": "GBP438.46",
                     "id": "B4HcfFpjZ2SLqN5UkpDRzH005",
                     "slice": [
                     {
                     "kind": "qpxexpress#sliceInfo",
                     "duration": 290,
                     "segment": [
                     {
                     "kind": "qpxexpress#segmentInfo",
                     "duration": 290,
                     "flight": {
                     "carrier": "LY",
                     "number": "318"
                     },
                     "id": "Gkr9-3d-T+QFmcbV",
                     "cabin": "COACH",
                     "bookingCode": "Q",
                     "bookingCodeCount": 9,
                     "marriedSegmentGroup": "0",
                     "leg": [
                     {
                     "kind": "qpxexpress#legInfo",
                     "id": "LjlESjbs3S6RNtfr",
                     "aircraft": "772",
                     "arrivalTime": "2015-12-31T05:20+02:00",
                     "departureTime": "2015-12-30T22:30+00:00",
                     "origin": "LHR",
                     "destination": "TLV",
                     "originTerminal": "4",
                     "destinationTerminal": "3",
                     "duration": 290,
                     "mileage": 2229,
                     "meal": "Hot Meal"
                     }
                     ]
                     }
                     ]
                     }
                     ],
                     "pricing": [
                     {
                     "kind": "qpxexpress#pricingInfo",
                     "fare": [
                     {
                     "kind": "qpxexpress#fareInfo",
                     "id": "A2KEtNzgO42eMzX0QHy43cCvfIx7pKiPtFg+hb9r4NpY",
                     "carrier": "LY",
                     "origin": "LON",
                     "destination": "TLV",
                     "basisCode": "QUKOW"
                     }
                     ],
                     "segmentPricing": [
                     {
                     "kind": "qpxexpress#segmentPricing",
                     "fareId": "A2KEtNzgO42eMzX0QHy43cCvfIx7pKiPtFg+hb9r4NpY",
                     "segmentId": "Gkr9-3d-T+QFmcbV"
                     }
                     ],
                     "baseFareTotal": "GBP320.00",
                     "saleFareTotal": "GBP320.00",
                     "saleTaxTotal": "GBP118.46",
                     "saleTotal": "GBP438.46",
                     "passengers": {
                     "kind": "qpxexpress#passengerCounts",
                     "adultCount": 1
                     },
                     "tax": [
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "AP_001",
                     "chargeType": "GOVERNMENT",
                     "code": "AP",
                     "country": "IL",
                     "salePrice": "GBP5.40"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "UB",
                     "chargeType": "GOVERNMENT",
                     "code": "UB",
                     "country": "GB",
                     "salePrice": "GBP42.06"
                     },
                     {
                     "kind": "qpxexpress#taxInfo",
                     "id": "GB_001",
                     "chargeType": "GOVERNMENT",
                     "code": "GB",
                     "country": "GB",
                     "salePrice": "GBP71.00"
                     }
                     ],
                     "fareCalculation": "LON LY TLV Q99.61 M 390.80QUKOW NUC 490.41 END ROE 0.652504 FARE GBP 320.00 XT 71.00GB 42.06UB 5.40AP",
                     "latestTicketingTime": "2015-12-30T17:29-05:00",
                     "ptc": "ADT"
                     }
                     ]
                     }
                     ]
                     ]; */
                    //  }

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