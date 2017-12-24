trackerApp.controller('welcomeCtrl', function ($scope, $state, $mdDialog, dataBaseService) {


    $scope.openApp = function(){

        window.open('#/trips', '_self', false);

    };

    $scope.goToAgreement = function () {
        $state.go('agreement');
    }

    $scope.showAlert = function(ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        // Modal dialogs should fully cover application
        // to prevent interaction outside of dialog
        $mdDialog.show(
            $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title('Coming soon')
                .content('iOS and Android app will be available in the market very soon to help you in recording your trips in real-time.')
                .ariaLabel('GreatBear')
                .ok('Got it!')
                .targetEvent(ev)
        );
    };


    var i = 0;
//dcfzra40jo7ha.cloudfront.net
    //http://dcfzra40jo7ha.cloudfront.net/videos/
    //videoSource[0] = 'assets/videos/greatbear_alaska_sea.mp4';
    var videoSource = new Array();
    videoSource[0] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_alaska_sea_720.mp4';
    videoSource[1] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_alaska_fall_720.mp4';
    videoSource[2] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_alaska_boat_720.mp4';
    videoSource[3] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_alaska_glacier_720.mp4';
    videoSource[4] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_iceland_gayzer_720.mp4';
    videoSource[5] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_iceland_dayanotherday_720.mp4';
    videoSource[6] = 'http://dcfzra40jo7ha.cloudfront.net/videos/greatbear_icelnad_waterfall_720.mp4';
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

    //Tooltips
    $scope.demo = {
        showTooltip: false,
        tipDirection: 'bottom'
    };

    $scope.demo.delayTooltip = undefined;
    $scope.$watch('demo.delayTooltip', function(val) {
        $scope.demo.delayTooltip = parseInt(val, 10) || 0;
    });

});


