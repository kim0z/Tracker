trackerApp.controller('view0Ctrl',function($scope, $http, googleMapsAPIService, messages, localStorageService) {


    $scope.helloUser = localStorageService.get('user');
    console.log($scope.helloUser);

 $scope.go = function() {

    $scope.msg = 'clicked';
  }



    var i = 0;

    var videoSource = new Array();
    videoSource[0]='../../assets/videos/IMG_0302.MOV';
    videoSource[1]='../../assets/videos/IMG_0349.MOV';
    videoSource[2]='../../assets/videos/IMG_0317.MOV';
    var videoCount = videoSource.length;

    document.getElementById('myVideo').addEventListener('ended',myHandler,false);
    document.getElementById("myVideo").setAttribute("src",videoSource[0]);


    function myHandler() {

        i++;
        if(i == videoCount)
            i = 0;
        videoPlay(i);

    }

    function videoPlay(videoNum)
    {
        document.getElementById("myVideo").setAttribute("src",videoSource[videoNum]);
        document.getElementById("myVideo").load();
        document.getElementById("myVideo").play();
    }


  
});
