/**
 * Created by karim on 26/12/2015.
 */
// no need anymore, I save dates directly into table object
/*
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
 */

//##################################### Create Table ####################################
//    dataBaseService.createTable(dataTripId).then(function (results) {

//  createTable().then(function (results) {

//    console.log('new table');
//     console.log(results);

// $scope.table = results.data;
//algorithmsService.whenFlightNeeded(results.data).then(function (results) {
//ß  $scope.table = algorithmsService.whenFlightNeeded(createTable()); // This alg check weather flight needed and give true
//$scope.table = results.data;

//Request flight for each true flight
//{origin: "TLV", destination:"JFK", date:"2015-12-30", solutions: 10};
//var flightParam = {origin: "TLV", destination:"JFK", date:"2015-12-30", solutions: 10};
//dataBaseService.getFlights();

/*
 response example: [{"day":1,"city":"haifa","flight":"","car":"","action1":"","action2":""},{"day":2,"city":"london","flight":"","car":"","action1":"","action2":""},{"day":3,"city":"london","flight":"","car":"","action1":"","action2":""},{"day":4,"city":"london","flight":"","car":"","action1":"","action2":""},{"day":5,"city":"new york","flight":"","car":"","action1":"","action2":""},{"day":6,"city":"new york","flight":"","car":"","action1":"","action2":""},{"day":7,"city":"new york","flight":"","car":"","action1":"","action2":""},{"day":8,"city":"new york","flight":"","car":"","action1":"","action2":""},{"day":9,"city":"paris","flight":"","car":"","action1":"","action2":""},{"day":10,"city":"paris","flight":"","car":"","action1":"","action2":""},{"day":11,"city":"madrid","flight":"","car":"","action1":"","action2":""},{"day":12,"city":"madrid","flight":"","car":"","action1":"","action2":""},{"day":13,"city":"madrid","flight":"","car":"","action1":"","action2":""},{"day":14,"city":"madrid","flight":"","car":"","action1":"","action2":""},{"day":15,"city":"mali","flight":"","car":"","action1":"","action2":""},{"day":16,"city":"chad","flight":"","car":"","action1":"","action2":""}]
 */

// THIS CODE SHOLE BE REPLACED BY USING DIRECTLLY $scope.table[dayIndex].flight.flight

/*

 var itemsArray = [];
 var flightsFlag = [];
 for (var i = 0; i < $scope.table.length; i++) {
 itemsArray.push($scope.table[i]);

 flightsFlag[i] = $scope.table[i].flight.flight; // update each day in the table with the flag

 }

 $scope.items = itemsArray;

 $scope.flightsFlag = flightsFlag;

 */
////////////////////////////////////////////////////////////////////////////////

//this $scope.userTable --> not sure if required because I'm using $scope.items in the ng repeat

/*
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


 */

//go over all the days in table, check the flag of flight if True then get flights for that day, to the next day
/*
 for (let dayIndex = 0; dayIndex < $scope.table.length - 1; dayIndex++) {
 if (!$scope.table[dayIndex].flight.flight) {
 $scope.flightsByPrice[dayIndex] = false; //it means no need to get flight for this day
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
 $scope.flightsByPrice[dayIndex] = algorithmsService.getFlightsByPrice(data);
 })
 .error(function (data, status) {
 console.error('error', status, data);
 })
 .finally(function () {
 console.log('finally');
 });
 }

 console.log($scope.flightsByPrice);

 }



 */


//  });