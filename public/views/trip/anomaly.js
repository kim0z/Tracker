/**
 * Created by karim on 13/01/2017.
 */
var removeAnomaly = function (point1, point2, anomalyDetectedStatus) {
    if(anomalyDetectedStatus == false){


        if((point2['coords'].latitude - point1['coords'].latitude > 1 || point2['coords'].longitude - point1['coords'].longitude > 1)
            && (point2['coords'].latitude - point1['coords'].latitude < 10 || point2['coords'].longitude - point1['coords'].longitude < 10)){
            //anomaly was detected
            anomalyDetected = true;
            console.log('point2 lat', point2['coords'].latitude);
            console.log('point1 lat', point1['coords'].latitude);
            console.log('point2 long', point2['coords'].longitude);
            console.log('point1 long', point1['coords'].longitude);

            //for testing, point 2 timestamp should be > point 1 timestamp
            console.log('point2 time', point2['timestamp']);
            console.log('point1 time', point1['timestamp']);

            lastNormalPoint = point1;
            return false;

        }else{
            return true;
        }



    }else{
        //when anomaly detected then the normal point should be saved until the next normal point will be found
        //example 1 1 1 1 1 3 3 3 3 1 1 1 2 2 2, the anomaly is 3, the detection should be between 1 and 3
        //when anomaly detected then 1 will be saved as the last normal point
        //now compare the last normal point with each new point

        if(point2['coords'].latitude - lastNormalPoint['coords'].latitude > 1 || point2['coords'].longitude - lastNormalPoint['coords'].longitude > 1){
            //anomaly was detected
            anomalyDetected = true;
            console.log('point2 lat', point2['coords'].latitude);
            console.log('point1 lat', lastNormalPoint['coords'].latitude);
            console.log('point2 long', point2['coords'].longitude);
            console.log('point1 long', lastNormalPoint['coords'].longitude);

            //for testing, point 2 timestamp should be > point 1 timestamp
            console.log('point2 time', point2['timestamp']);
            console.log('point1 time', lastNormalPoint['timestamp']);

            return false;

        }else{
            //turn anomaly off
            anomalyDetected = false;
            return true;
        }



    }

}