trackerApp.controller('console', function($scope, messages) {

  $scope.steps = messages.getSteps();

    var iframe = document.getElementById('iframe');
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write('<div id="map" style="width: 100%; height: 100%"></div>');
    iframe.contentWindow.document.close();

    var mapContainer = iframe.contentWindow.document.querySelector('#map');



  $scope.map = new google.maps.Map(mapContainer, {
    //center: {lat: 34.397, lng: 40.644},
    center: {lat: 48.7, lng: 31},
    zoom: 4
  });

  var drawingManager = new google.maps.drawing.DrawingManager({

  });
  drawingManager.setMap($scope.map);




});



