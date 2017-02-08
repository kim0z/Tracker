trackerApp.controller('DemoController', function($scope, $sce) {

  $scope.photos = [{
    fullres: 'http://www.planwallpaper.com/static/images/hd_nature_wallpaper.jpg',
    thumbnail: 'http://www.planwallpaper.com/static/images/hd_nature_wallpaper.jpg'
  }, {
    fullres: 'http://www.planwallpaper.com/static/images/hd_nature_wallpaper.jpg',
    thumbnail: 'http://www.planwallpaper.com/static/images/hd_nature_wallpaper.jpg'
  }, {
    fullres: 'http://www.planwallpaper.com/static/images/hd_nature_wallpaper.jpg',
    thumbnail: 'http://www.planwallpaper.com/static/images/hd_nature_wallpaper.jpg'
  }, {
    fullres: 'http://www.planwallpaper.com/static/images/hd_nature_wallpaper.jpg',
    thumbnail: 'http://www.planwallpaper.com/static/images/hd_nature_wallpaper.jpg'
  }];

  for (var i = 0; i < $scope.photos.length; i++) {
    $scope.photos[i].fullres = $sce.trustAsResourceUrl($scope.photos[i].fullres);
  }

}).directive('lightgallery', function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      if (scope.$last) {
        element.parent().lightGallery({
          thumbnail: true
        });


      }
    }
  };
})


