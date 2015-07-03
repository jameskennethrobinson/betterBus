window.infoWindow=null;
angular.module('app.details', [])
.controller('DetailsController', function($scope, route, LocationService, userLocation, RestBusService, MapService, VehiclesService, YelpService, SimpleAuthService, FirebaseService) {
  var authData = SimpleAuthService.authData;
  if (authData) {
    $scope.userId = authData.uid;
    //FirebaseService.
  }

  RestBusService.getRouteDetailed(route.route.id) //since the app.details stateparams only use the uniqId for now, it doesn't have the route info so we can't do it all in the app.js router part like they did for route
  .then(function(data) {
    $scope.stops = data.stops;

    RestBusService.getStationLocation($scope.map, route, $scope.stops, function() { //ugh refactor still needed, buncha shit together TODO but necessary this way for now
      var imgName = 'stop';
      if (userId) {
        FirebaseService.visitStop(route.route.id, userId, RestBusService.closestStop.id); //user optionally logged in
        FirebaseService.getVisitedStops().then(function(stops) {
          console.log(stops); //incorrect TODO;
          //debugger;
        });
      }
      $scope.stationMarker = MapService.createMarker($scope.map, RestBusService.closestStop.loc, './img/station.png');
    $scope.stopMarkers = [];

      data.stops.forEach(function(stop, index) { //has to be inside cb to ensure isVisited set for now (deal with setVisited promise to fix)
        //if (userId && visitedStops[stop.id]) imgName = 'stopVisited';
        //
        //if (userId) {
          //var isVisited = FirebaseService.checkVisited(route.route.id, userId, RestBusService.closestStop.id)
          //debugger;
          //.then(function(isVisited) {
            //if (isVisited) imgName = 'stopVisited';
          //});
        //}
        $scope.stopMarkers[index] = MapService.createMarker($scope.map, {latitude: stop.lat, longitude: stop.lon}, './img/'+imgName+'.png');

        //create event listener
        google.maps.event.addListener($scope.stopMarkers[index], 'click', function() {
          console.log('clicked stop');
          if(window.infoWindow){
            window.infoWindow.close();
            window.infoWindow = null;
          }
          YelpService.getLocalBusinesses({latitude: stop.lat, longitude: stop.lon}, function(data) {
            console.log(data);
            var place = data[YelpService.feelingLucky(data.length)];
            window.infoWindow = new google.maps.InfoWindow({
              content: YelpService.formatData(place)
            });
            window.infoWindow.open($scope.map, $scope.stopMarkers[index]);
          });
        });
      });
    });
    //$scope.stops = data.stops;
    //_.pluck(data.stops, 
    //debugger;
  });
  $scope.route = route;
  //testing for yelp
  // RestBusService.getRouteDetailed(route.route.id)
  // .then(function(data){
  //   console.log(data);
  //   YelpService.getYelpForRoute(data, function(results){
  //     console.dir(results);
  //   });
  // });
  $scope.userLocation = userLocation;
  $scope.map = MapService.createMap($scope.userLocation);
  $scope.userMarker = MapService.createMarker($scope.map, $scope.userLocation, './img/user.png');
  $scope.vehicleMarkers = MapService.displayVehicles($scope.map, $scope.route, './img/bus.png');

  //Called from ionic pulldown refresh
  $scope.doRefresh = function() {
    //MapService.refreshStationMarker($scope.stationMarker);
    MapService.refreshUserMarker($scope.userMarker);
    MapService.refreshVehicleMarkers($scope.vehicleMarkers);
    //debugger;
    //if (userId) FirebaseService.visitStop(route.route.id, userId, RestBusService.closestStop.id); //user optionally logged in

    $scope.$broadcast('scroll.refreshComplete');
  };

  $scope.drawLine = function(){
    var routeId = $scope.route.route.id;
    $.ajax({
      url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&r="+routeId,
      dataType:"xml"
    }).done(function(xmlData){
      var jsonData = xml.xmlToJSON(xmlData);
      console.dir(jsonData);
      var path = jsonData.body.route.path;
      for(var i = 0; i< path.length; i++){
        var point = path[i].point;
        var stopLocs = [];
        for (var j = 0; j < point.length; j++) {
          stopLocs.push([point[j]['@lat'],point[j]['@lon']]);
        }
        MapService.createRouteLine(stopLocs,$scope.map);

      }
    });
  };
  $scope.drawLine();
  //Initial page load
  $scope.doRefresh();

});


//testStops will include mock testStops
//mock 

//need to display yelp icon
