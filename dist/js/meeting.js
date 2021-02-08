const constraints = {
  audio: true,
  video: true
};
navigator.mediaDevices.getUserMedia(constraints).
then((stream) => {
  console.log(stream); // This is basic handler with stream input.
});

class MeetingApp {
  constructor() {
    //this.baseUrl = location.protocol + '//' + location.host + location.pathname.replace(/\/*$/, '/');
    this.baseUrl = location.protocol + "//" + location.host + "/";
    this.loggerBatchSize = 85;
    this.loggerIntervalMs = 1150;
    this.title = "51"; // vanno inseriti i valori corretti
    this.name = "medico"; // vanno inseriti i valori corretti
    this.initEventListeners();
    this.initObserver();
    this.initDeviceObserver();
    this.initDicom();
  }
  
  async muteMic() {
    this.meetingSession.audioVideo.realtimeMuteLocalAudio();
  }

  async unmuteMic() {
    this.meetingSession.audioVideo.realtimeUnmuteLocalAudio();
  }

  initEventListeners() {
    new ChimeSDK.AsyncScheduler().start(async () => {
      this.joinMeeting();
    });
    
    var buttonMute = document.getElementById("mute");
    var buttonUnMute = document.getElementById("unmute");
    
    buttonMute.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Mute clicked")
      buttonMute.hidden = true;
      buttonUnMute.hidden = false;
      this.muteMic();
    });
    
    buttonUnMute.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Unmute clicked")
      buttonUnMute.hidden = true;
      buttonMute.hidden = false;
      this.unmuteMic();
    });

    /*
    const buttonMeetingEnd = document.getElementById('meeting-end');
    buttonMeetingEnd.addEventListener('click', (e) => {
      e.preventDefault();
      new ChimeSDK.AsyncScheduler().start(
        async () => {
          this.endMeeting();
          this.leave ();
        }
      );
    });
    */
  }

  initObserver() {
    this.observer = {
      audioVideoDidStart: () => {
        this.meetingSession.audioVideo.startLocalVideoTile();
      },
      videoTileDidUpdate: (tileState) => {
        if (tileState.boundAttendeeId) {
          let videoElement = "";
          if (tileState.localTile) {
            videoElement = "meeting-video-local";
          } else if (tileState.isContent) {
            videoElement = "meeting-video-sharing";
          } else {
            videoElement = "meeting-video-remote";
          }
          const vtile = document.getElementById(videoElement);
          this.meetingSession.audioVideo.bindVideoElement(
            tileState.tileId,
            vtile
          );
        }
      }
    };
  }

  initDeviceObserver() {
    this.deviceObserver = {
      audioInputsChanged: () => {},
      audioOutputsChanged: () => {},
      videoInputsChanged: () => {},
    };
  }
  


  
  copyFrame(){
        if(this.video1 === undefined)
          this.video1 = document.getElementById('meeting-video-remote');// video-example meeting-video-remote
        if(this.video2 === undefined)
          this.video2 = document.getElementById('meeting-video-remote2');
        if(this.video3 === undefined)
          this.video3 = document.getElementById('meeting-video-sharing');// meeting-video-sharing - video-example2
        if(this.tempCanvas === undefined)
          this.tempCanvas = document.getElementById("canvas1");
        if(this.inputX === undefined)
          this.inputX = document.getElementById("inputX");
        if(this.inputY === undefined)
          this.inputY = document.getElementById("inputY");
        // Set the source of one <video> element to be a stream from another.
        var stream2 = this.video1.captureStream();
        var stream = this.video3.captureStream();
        if(typeof stream.getVideoTracks()[0] !== "undefined"){
          var videoWidth = stream.getVideoTracks()[0].getSettings().width;
          var videoHeight = stream.getVideoTracks()[0].getSettings().height;
          this.tempCanvas.width = 1280;
          this.tempCanvas.height = 720;
          this.tempCanvas.getContext("2d").drawImage(this.video3, 0, 0, this.tempCanvas.width, this.tempCanvas.height);
          
          var canvasOut = document.createElement("canvas");
          canvasOut.width = 1024/2;
          canvasOut.height = 768/2;
          canvasOut.getContext("2d").drawImage(this.video1, 0, 0, canvasOut.width, canvasOut.height);
          var frame = canvasOut.getContext("2d").getImageData(0, 0, canvasOut.width, canvasOut.height);
              var l = frame.data.length / 4;
      
          for (var i = 0; i < l; i++) {
            var r = frame.data[i * 4 + 0];
            var g = frame.data[i * 4 + 1];
            var b = frame.data[i * 4 + 2];
            if (g > r && g> b)
              frame.data[i * 4 + 3] = 0;
          }
          
          canvasOut.getContext("2d").putImageData(frame,0,0);
          // draw the temporary gradient canvas on the visible canvas
          console.log(this.inputX.value,this.inputY.value);
          this.tempCanvas.getContext("2d").drawImage(canvasOut,this.inputX.value,this.inputY.value);
          
          
          //tempCanvas.getContext("2d").putImageData(frame, 0, 0);
          
          //tempCanvas.getContext("2d").drawImage(video1, 0, 0, tempCanvas.width/2, tempCanvas.height/2);
        }
        requestAnimationFrame(this.copyFrame.bind(this));
  }
  
  drawFace(xClicked,yClicked) {
     var elem = document.getElementById("canvas1");
    var inputX = document.getElementById("inputX");
    var inputY = document.getElementById("inputY");
    var canvasW = elem.getBoundingClientRect().width;
    var canvasH = elem.getBoundingClientRect().height;
    var x = xClicked - elem.offsetLeft,
        y = yClicked - elem.offsetTop;
    x = x -15;
    y = y -137;
    console.log('offset', elem.offsetLeft,elem.offsetTop);
    console.log('x,y',x, y);
    console.log('canvas',canvasW,canvasH);
    var newX = x / canvasW * elem.width;
    var newY = y / canvasH * elem.height;
    console.log('new x, new y',newX, newY);
    newX = newX - (1024/2/2);
    newY = newY - (768/2/2) ;
    console.log('new x, new y',newX, newY);
    if(newX<0)
      newX = 0;
    if(newY<0)
      newY = 0;
    console.log('new x, new y',newX, newY);
      
    inputX.value = newX;
    inputY.value = newY;
  }

  initDicom() {
    this.isDrawing = false;
    var elem = document.getElementById("canvas1");
    /*elem.addEventListener('click', event => {
        this.drawFace(event.pageX, event.pageY);
    });*/
    
    elem.addEventListener('mousedown', e => {
      this.isDrawing = true;
    });
    
    elem.addEventListener('mousemove', e => {
      if (this.isDrawing === true) {
        this.drawFace(e.offsetX, e.offsetY);
      }
    });
    
    window.addEventListener('mouseup', e => {
      if (this.isDrawing === true) {
        this.isDrawing = false;
      }
    });

  
  }
  
  

  async joinMeetingOld() {
    var data = {title:'444'};
    fetch(
      this.baseUrl +
        "join?title=" +
        this.title +
        "&name=" +
        this.name +
        "&region=eu-west-1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        const joinInfo = data.JoinInfo;
        this.initializeMeetingSession(joinInfo.Meeting, joinInfo.Attendee);
        
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
  
    async joinMeeting() {
    var data = {meetingName:'151',userId:"cata86@gmail.com",userName:"Andrea2"};
    fetch(
        "https://h7j1gol371.execute-api.eu-west-1.amazonaws.com/prod/meetings/151/attendees2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        const joinInfo = data;
        this.initializeMeetingSession(joinInfo.Meeting, joinInfo.Attendee);
              var video1 = document.getElementById('meeting-video-remote');
              var video2 = document.getElementById('meeting-video-remote2');
              video1.onplay = function() {
                var tempCanvas = document.getElementById("canvas1");
                // Set the source of one <video> element to be a stream from another.
                var stream = video1.captureStream();
                var videoWidth = stream.getVideoTracks()[0].getSettings().width;
                var videoHeight = stream.getVideoTracks()[0].getSettings().height;
                //tempCanvas.width = videoWidth;
                //tempCanvas.height = videoHeight;
                tempCanvas.getContext("2d").drawImage(video1, 0, 0, tempCanvas.width, tempCanvas.height);
                video2.srcObject = stream;
                video2.play();
              };
               this.copyFrame();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
  
  

  initializeMeetingSession(meeting, attendee) {
let logger;
    const configuration = new ChimeSDK.MeetingSessionConfiguration(
      meeting,
      attendee
    );
    if (
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    ) {
      logger = new ChimeSDK.ConsoleLogger(
        "ChimeMeetingLogs",
        ChimeSDK.LogLevel.WARNING
      );
    } else {
      logger = new ChimeSDK.ConsoleLogger(
        "ChimeMeetingLogs",
        ChimeSDK.LogLevel.WARNING
      );
    }
    
    const deviceController = new ChimeSDK.DefaultDeviceController(logger);
    this.meetingSession = new ChimeSDK.DefaultMeetingSession(
      configuration,
      logger,
      deviceController
    );
    this.manageAudioVideo();
  }

  async manageAudioVideo() {
    try {
      const audioInputs = await this.meetingSession.audioVideo.listAudioInputDevices();
      // permette di scegliere l'output ma funziona solo su chrome ed edge
      //const audioOutput = await this.meetingSession.audioVideo.listAudioOutputDevices();
      const videoInputs = await this.meetingSession.audioVideo.listVideoInputDevices();

      await this.meetingSession.audioVideo.chooseAudioInputDevice(
        audioInputs[0].deviceId
      );
      /*await this.meetingSession.audioVideo.chooseVideoInputDevice(
        videoInputs[0].deviceId
      );*/
      this.bindAudio();
      this.sessionStart();
    } catch (err) {
      console.log("Errore manageAudioVideo");
      console.log(err);
    }
  }

  bindAudio() {
    const audioOutputElement = document.getElementById("meeting-audio");
    this.meetingSession.audioVideo.bindAudioElement(audioOutputElement);
  }

  async setupVideoIn() {
    try {
      const videoInputs = await this.meetingSession.audioVideo.listVideoInputDevices();
      // scelgo il primo dispositivo della lista
      await this.meetingSession.audioVideo.chooseVideoInputDevice(
        videoInputs[0].deviceId
      );
    } catch (err) {
      console.log("Errore setupVideoIn");
      console.log(err);
    }
  }

  async endMeeting() {
    try {
      fetch(this.baseUrl + "end?title=" + this.meeting, {
        method: "POST",
      });
    } catch (err) {
      console.log("Errore endMeeting");
      console.log(err);
    }
  }

  leave() {
    this.meetingSession.screenShare
      .stop()
      .catch(() => {})
      .finally(() => {
        return this.meetingSession.screenShare.close();
      });
    this.meetingSession.screenShareView.close();
    this.meetingSession.audioVideo.stop();
    this.roster = {};
  }

  sessionStart() {
    this.meetingSession.audioVideo.addDeviceChangeObserver(this.deviceObserver);
    this.meetingSession.audioVideo.addObserver(this.observer);
    this.meetingSession.audioVideo.start();
  }
}

// https://pages.awscloud.com/Building-Real-Time-Audio-and-Video-Calling-in-Your-Applications-with-the-Amazon-Chime-SDK_2020_0329-BAP_OD.html

window.addEventListener("load", () => {
  new MeetingApp();
});

// https://github.com/aws-samples/amazon-chime-sdk-classroom-demo/blob/master/app/chime/ChimeSdkWrapper.ts
