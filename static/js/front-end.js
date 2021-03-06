var clientId = guid();

var app = new Vue({
    el: '#app',
    data: {
        socket: null,
        message: 'Hello Vue!',
        cameras: [],
        computes: [],
        projectors: [],
        photos: [
            {
                imagePath: '/img/placeholder.png',
                cameraName: 'test'
            },
            {
                imagePath: '/img/placeholder.png',
                cameraName: 'test'
            },
            {
                imagePath: '/img/placeholder.png',
                cameraName: 'test'
            },
            {
                imagePath: '/img/placeholder.png',
                cameraName: 'test'
            }
        ],
		camerasMap: []
    },
    computed: {
        orderedCameras: function () {
            return this.cameras.sort(function(a, b){
                return a.name.localeCompare( b.name );
                //if (isNaN(a) || isNaN(b)) {
                //    return -1;
                //}
                //return a - b;
            });
        },
        orderedComputes: function() {
          return this.computes;
        },
		camerasMapList: function(){ //@Lip add camerasMap
			return this.camerasMap;
		}
    },
    created: function () {
        this.socket = io('http://' + location.hostname + ':3000');

        this.socket.emit('client-online', {});

        var that = this;

        this.socket.on('camera-update', function(response) {
    			var oldCams = that.cameras.slice();
          that.cameras = [];
          for (let i = 0; i < response.length; i++) {
            if (response[i].type == 'camera' || response[i].type == 'compute') {
                var photoError = '';
                if (response[i].photoError) {
                    photoError = 'yes';
                }
                response[i].photoError = photoError;
                lastUpdateProblem = false;
                var timeSinceLastUpdate = Math.round((new Date() - new Date(response[i].lastCheckin)) / 100) / 10;
                if ((timeSinceLastUpdate > 10) && !response[i].photoSending) {  //@Lip if the camera is not sending photo and not signalling a checkin in 10 secs
                    lastUpdateProblem = true;
                }
                response[i].lastUpdateProblem = lastUpdateProblem;
                response[i].timeSinceLastUpdate = timeSinceLastUpdate;

                if ( "Disconnect" == response[i].DSLRBatteryLevel ){
                  response[i].DSLRBatteryLevel_color = "red";
                } else if ( "50%" == response[i].DSLRBatteryLevel ){
                  response[i].DSLRBatteryLevel_color = "yellow";
                } else if ( "25%" == response[i].DSLRBatteryLevel ){
                  response[i].DSLRBatteryLevel_color = "orange";
                }

                if ( response[i].photoTimeDelta ){
                  if ( 16.7 < Math.abs( response[i].photoTimeDelta )){
                    response[i].photoTimeDelta_color = "orange";
                  }
                }else{
                  response[i].networkLatency = response[i].photoTimeDelta = "";
                }
                response[i].photoTimeDelta = response[i].photoTimeDelta + "/" + response[i].networkLatency;

                if ( response[i].photoTimeDelta_DSLR ){
                  if ( 16.7 < Math.abs( response[i].photoTimeDelta_DSLR )){
                    response[i].photoTimeDelta_DSLR_color = "orange";
                  }
                }else{
                  response[i].networkLatency_DSLR = response[i].photoTimeDelta_DSLR = "";
                }
                response[i].photoTimeDelta_DSLR = response[i].photoTimeDelta_DSLR + "/" + response[i].networkLatency_DSLR;


      					if ( oldCams[i] ){
      						response[i].preview = oldCams[i].preview;
      					}
                that.cameras.push(response[i]);
            }
          }
        });

        //Update the projectors info. in frontend
        this.socket.on('projector-update', function(response){
          that.projectors = [];
          for ( var i=0; i<response.length; ++i ){
            //Timing
            lastUpdateProblem = false;
            var timeSinceLastUpdate = Math.round((new Date() - new Date(response[i].lastCheckin)) / 100) / 10;
            if ( timeSinceLastUpdate > 10 ) {  //@Lip if the camera is not sending photo and not signalling a checkin in 10 secs
                lastUpdateProblem = true;
            }
            response[i].lastUpdateProblem = lastUpdateProblem;
            response[i].timeSinceLastUpdate = timeSinceLastUpdate;

            if ( response[i].photoTimeDelta ){
              if ( 16.7 < Math.abs( response[i].photoTimeDelta )){
                response[i].photoTimeDelta_color = "orange";
              }
            }else{
              response[i].networkLatency = response[i].photoTimeDelta = "";
            }
            response[i].photoTimeDelta = response[i].photoTimeDelta + "/" + response[i].networkLatency;
            that.projectors.push(response[i]);
          }
        });

        this.socket.on('compute-update', function(response) {
          for ( var i=0; i<response.length; ++i ){
            ///response[i].warning = false;
          }
          that.computes = response;
        });

		this.socket.on('camerasMap-update', function(response) {
            console.log("-=-=-=-=-camera update", response);
            that.camerasMap = [];
			for (var value of response.values()) {
				for (let i = 0; i < value.length; i++) {
					if (value[i].type == 'camera') {
						var photoError = '';
						if (value[i].photoError) {
							photoError = 'yes';
						}
						value[i].photoError = photoError;
						lastUpdateProblem = false;
						var timeSinceLastUpdate = Math.round((new Date() - new Date(response[i].lastCheckin)) / 100) / 10;
						if ((timeSinceLastUpdate > 10) && !value[i].photoSending) {
							lastUpdateProblem = true;
						}
						value[i].lastUpdateProblem = lastUpdateProblem;
						value[i].timeSinceLastUpdate = timeSinceLastUpdate;

						that.camerasMap.push(value[i]);
					}
				}
			}
        });

    this.socket.on('new-photo', function(data){
        that.photos.push(data);
    });

    this.socket.on('photo-error', function(data){
        console.log(data);
    });

		this.socket.on('command-finished', function(data){
      console.log(data);
    });

		this.socket.on('command-error', function(data){
      console.log(data);
    });

    this.socket.on('take-photo', function(data){
      that.photos = [];
      $()
    });
    this.socket.on('take-photo-DSLR', function(data){
      that.photos = [];
      $()
    });

    this.socket.on('reconstruct-complete', function(data) {
      var computeUnit = data.computeUnit;
      var $fileDialog = $("#dir-" + computeUnit.ipAddress.replace( /\./g, "_" ));
      var $button =  $("#btn-" + computeUnit.ipAddress.replace( /\./g, "_" ));

      $button.prop('disabled', false);
      $button.prop('value', "Reconstruct");
      $button.css('background-color', "#31b0d5");
      $fileDialog.prop('disabled', false);
    });

    this.socket.on('reconstruct-log', function(data){
      var $logger = $('#reconstruct-logger');
      $logger.text( data );
    });
    },
    methods: {
        takePhoto: function () {
            takeId = guid();
            var countDown = 10000; //10 seconds, should be at least 2 secs
            var gg = this;
            var currentTime = Date.now();

            this.socket.emit('take-photo-DSLR', {takeId: takeId, time: currentTime, countDown: countDown });

            setTimeout(function(){
              gg.socket.emit('take-photo', {takeId: takeId, time: currentTime, countDown: countDown });
            }, 1000 );

            //this.socket.emit('timeSync-test',{time:Date.now(), countDown: countDown});
			      //this.socket.emit('take-photo-webcam', {takeId: takeId, time: Date.now()});	//@Lip add for WebCam support
        },
        takePhoto_DSLR: function() {
          takeId = guid();
          this.socket.emit('take-photo-DSLR', {takeId: takeId, time: Date.now()});
        },
        updateSoftware: function () {
            this.socket.emit('update-software', {});
        },
        updateName: function (socketId, event) {
            console.log("Update name", socketId, event.target.value);
            this.socket.emit('update-name', {socketId: socketId, newName: event.target.value});
            event.target.value = null;
        },
		executeCommand: function(event) {//@Lip execute command
			console.log("Execute command", event.target.value);
			var cmd = event.target.value;
			this.socket.emit('execute-command', {command: cmd});
			event.target.value = null;
		},
		enablePreview: function(event) {//@Lip show previews
			//var container = document.getElementById('cam-preview');
			var $container = jQuery("#cam-preview");
			if ( $container.is(":visible")){
				$container.hide();
			}else{
				var rand = Math.random();
				for (let i = 0; i < this.cameras.length; i++) {
					if (this.cameras[i].type == 'camera') {
						this.cameras[i].preview = rand;
					}
				}
				$container.show();
			}
		},
		lightSwitch: function(event) {//@Lip turn on lights

			var $button = $('#lights-button');

			if ( "Lights On" == $button[0].value ) {
				this.socket.emit('lights-switch', {state: "on"});
				$button[0].value = "Lights Off";
				$button.css({"background-color": "red", "border-radius": "10%"});
			}else{
				this.socket.emit('lights-switch', {state: "off"});
				$button[0].value = "Lights On";
				$button.css("background-color", "#5cb85c");
			}
		},
    reconstructObj: function( e, elem) {//@Lip ask the compute-node/cloud to reconstuct the model
      var $fileDialog = $("#dir-" + elem.ipAddress.replace( /\./g, "_" ));
      var $button =  $("#btn-" + elem.ipAddress.replace( /\./g, "_" ));

      this.socket.emit('reconstruct-obj', { computeUnit: elem, files: $fileDialog[0].files });
      $button.prop('disabled', true);
      $button.prop('value', "Processing...");
      $button.css('background-color', "pink");
      $fileDialog.prop('disabled', true);
    }
    }
})

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
