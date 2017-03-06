
var websocket = require('websocket-stream'); // stream over websocket 
var rpc = require('rpc-multistream'); // stream multiplexer and rpc
var route = require('page'); // minimal router
var $ = require('jquery');
var L = require('leaflet');

var settings = require('./settings.js');

function init() {
  
  plotExample();
  connect();

  // init routes

  route.base(settings.basePath); // set base url path

  route('/', function(ctx, next) {
    tabTo('map');
    
  });

  route('/map', function(ctx, next) {
    tabTo('map');
  });

  route('/list', function(ctx, next) {
    tabTo('list');
  });

  route('/admin', function(ctx, next) {
    tabTo('admin');
  });

  route('/about', function(ctx, next) {
    tabTo('about');
  });

  route('*', function(ctx, next) {
    
  });

  route();

  // bindings for menu

  // menu show/hide on click
  $('#menu .icon').click(function(e) {
    e.stopPropagation();

    if($('#menu ul').css('display') === 'none') {
      $('#menu ul').css('display', 'block');
    } else {
      $('#menu ul').css('display', 'none');
    }
  });
  $('#menu').mousedown(function(e) {
    e.stopPropagation();    
  });

  // menu mouse-over highlighting
  $('#menu ul li').hover(function(e) {
    // on mouse enter
    $('#menu ul li').removeClass('highlight');
    $(e.target).closest('li').addClass('highlight');
  }, function(e) {
    // on mouse exit
    $('#menu ul li').removeClass('highlight');
    $('#menu ul li.current').addClass('highlight');
  });

  // menu item click handling
  $('#map ul li a').click(function(e) {
    $('#menu ul li').removeClass('current highlight');
    $(e.target).closest('li').addClass('current highlight');

    $('#menu ul').css('display', 'none');
  });

  // menu disappears when clicking elsewhere
  $('body').mousedown(function(e) {
    $('#menu ul').css('display', 'none');
  });
}


// make the specified ui tab visible and hide all others
function tabTo(tabID) {
  $('.tab').removeClass('active-tab');
  $('#'+tabID).addClass('active-tab');
}

var reconnectDelay = 2;
var reconnectAttempts = 0;
var reconnectAttemptsMax = 10;

function reconnect() {
    if (reconnectAttempts > reconnectAttemptsMax) {
        console.log("Disconnected from server. Gave up trying to reconnect after " + reconnectAttemptsMax + " attempts.", {
            level: 'error',
            time: false
        });
        return;
    }
    var delay = Math.pow(reconnectDelay * reconnectAttempts, 2);
    if (reconnectAttempts) {
        console.log("Disconnected from server. Attempting to reconnect in " + delay + " seconds", {
            level: 'error',
            time: (delay - 1) * 1000
        });
    }
    console.log("reconnecting in", delay, "seconds");
    setTimeout(connect, delay * 1000);
    reconnectAttempts++;
}

function connector(cb) {

    var failed = false;

    function failOnce(err) {
        console.log('main.js failOnce error:', (typeof err === 'object') ? err.message + ' ' + err.stack : err);
        if (!failed) {
            cb(err);
            failed = true;
        }
    }

    var wsProtocol = 'ws://';
    if(window.location.protocol.match(/^https/i)) {
        wsProtocol = 'wss://';
    }

    var websocketUrl = wsProtocol + window.document.location.host;
    console.log('connecting to websocket', websocketUrl)

    var stream = websocket(websocketUrl);
    stream.on('error', failOnce);

    // You can turn on debugging like this:
    //   var rpcClient = rpc(null, {debug: true});
    var rpcClient = rpc(null, {
        objectMode: true
    });

    rpcClient.pipe(stream).pipe(rpcClient);

    rpcClient.on('error', failOnce);

    rpcClient.on('methods', onConnect);
}

// ToDo get rid of these globals
function connect() {
    console.log("attempting to connect");

    connector(function (err, remote, user) {
        if (err) {
            console.log("connection attempt failed");
            reconnect();
            return;
        }
        if (reconnectAttempts) {
            console.log("Reconnected!");
        }
        reconnectAttempts = 0;
    })
}


function plotExample() {

  var sudoMeshHQPosition = [37.83499,-122.26432];

  var mymap = L.map('map').setView(sudoMeshHQPosition, 13);

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'marcjuul/cizng13f0001n2ro1bau1xous',
    accessToken: 'pk.eyJ1IjoibWFyY2p1dWwiLCJhIjoiY2l6bmZ6ZDJmMDJsNjJxbDI2eWdpa2U1diJ9.OLtK_xSdi--ZNVAG2BHA_g'
  }).addTo(mymap);

  var pointA = new L.LatLng(37.85499,-122.22432);
  var pointB = new L.LatLng(37.83499,-122.26432);

  var marker = new L.marker(pointA, {
    //        icon: L.icon({}),
    title: 'hills',
    alt: 'hills',
    riseOnHover: true
  });

  marker.addTo(mymap);

  var marker2 = new L.marker(pointB, {
    //        icon: L.icon({}),
    title: 'sudo room',
    alt: 'sudo room',
    riseOnHover: true
  });

  marker2.addTo(mymap);

  var points = [pointA, pointB];

  var line = new L.Polyline(points, {
    color: 'green',
    weight: 3,
    opacity: 0.5,
    smoothFactor: 1
  });

  line.addTo(mymap);
}

function onConnect(remote) {

  console.log("Connected");

  remote.foo(function() {

    console.log("Successful RPC call!");

    var s = remote.babelRoutes();

    s.on('data', function(o) {
      console.log("babel says:", o);
    });

  });

}

// init

$(document).ready(init);

