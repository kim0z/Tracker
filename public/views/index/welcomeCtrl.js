trackerApp.controller('welcomeCtrl', function ($scope, $state, dataBaseService) {


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


    //Create new trip using wizard
    $scope.startWizard = function () {
        //create new empty trup, in this phase the id returned as a result
        dataBaseService.createNewTripRecord().then(function (results) {
            console.log('Client:: Welcome page:: Fun:: start wizard :: new empty trip record created with id:: ' + results.data);
            $state.go('wizard', {tripId: results.data});
        })
    }

});


