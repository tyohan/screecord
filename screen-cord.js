export default class screenCord{
  constructor(rootElement,videoConstraint,audioConstraint){
    this.stream = null;
    this.mediaRecorder = null;
    this.recordedChunks = null;
    this.objectUrl = null;
    this.videoConstraint = videoConstraint;
    this.audioConstraint = audioConstraint;
    this.rootElement = rootElement;
  }
  
 async toggleCapture(){
  if(!this.stream && !this.mediaRecorder){
      //reset state
      this.recordedChunks = [];
      if(this.objectUrl){
        window.URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = null;
      }
    
      const displayMediaOptions = {
        video: this.videoConstraint,
        audio: this.audioConstraint
      };
      console.log(displayMediaOptions);
    
      try {
        this.stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        this.recordStream();
      } catch(err) {
        console.error("Error: " + err);
      }
  } else {
    this.mediaRecorder.stop();
  }
}
  
stopCapture(){
  this.mediaRecorder = null;
  this.stream = null;
}
  
recordStream(){
    const options = { mimeType: "video/webm; codecs=vp9" };
    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = (e) => {
      //data streaming available to record
      console.log("data-available");
      if (e.data.size > 0) {
        //data streaming is not available means screen recording stopped.
        this.recordedChunks.push(e.data);

      } 
    };

    this.mediaRecorder.onstop = (e) =>{
        const tracks = this.stream.getTracks();
        //only call stop() if still active. Could be inactive if stop from browser directly
        if(this.mediaRecorder.state !=='inactive') this.mediaRecorder.stop();

        const blob = new Blob(this.recordedChunks, {
          type: "video/webm"
        });

        if(this.stream) this.stopCapture();
        this.onRecordingStop(blob);
    };

    this.mediaRecorder.start();

  }
  
}