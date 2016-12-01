trackerApp.controller('welcomeCtrl', function ($scope, $rootScope, $location, $state, $http, auth, localStorageService, serverSvc) {


    //$rootScope.hideToolBar = true;

    $scope.openApp = function(){

        window.open('#/trips', '_self', false);

    };


    var i = 0;

    var videoSource = new Array();
    videoSource[0] = 'assets/videos/IMG_0302.MOV';
    videoSource[1] = 'assets/videos/IMG_0349.MOV';
    videoSource[2] = 'assets/videos/IMG_0317.MOV';
    var videoCount = videoSource.length;

    document.getElementById('video').addEventListener('ended', myHandler, false);
    document.getElementById("video").setAttribute("src", videoSource[0]);

    function myHandler() {

        i++;
        if (i == videoCount)
            i = 0;
        videoPlay(i);
    }

    function videoPlay(videoNum) {
        document.getElementById("video").setAttribute("src", videoSource[videoNum]);
        document.getElementById("video").load();
        document.getElementById("video").playbackRate = 0.7;
        document.getElementById("video").play();
    }





});


