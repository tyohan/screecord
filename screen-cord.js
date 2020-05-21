export default class screenCord{
  constructor(rootElement,videoConstraint,audioConstraint,micConstraint){
    this.stream = null;
    this.mediaRecorder = null;
    this.recordedChunks = null;
    this.objectUrl = null;
    this.videoConstraint = videoConstraint;
    this.audioConstraint = audioConstraint;
    this.micConstraint = micConstraint;
    this.rootElement = rootElement;
  }
  
  static async getAudioInputs(){
      let devices = await navigator.mediaDevices.enumerateDevices();
      devices = devices.filter((d) => d.kind === 'audioinput');
      return devices;
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
        
        //we add track from microphone stream if constraint set
        if(this.micConstraint){
          const micStream = await navigator.mediaDevices.getUserMedia(this.micConstraint);
          micStream.getAudioTracks().forEach(track => {
            this.stream.addTrack(track);
          })
        }
        
        this.recordStream();
      } catch(err) {
        console.error("Error: " + err);
      }
  } else {
    //only call stop() if still active. Could be inactive if stop from browser directly
    if(this.mediaRecorder.state !=='inactive') this.mediaRecorder.stop();
  }
}
  
stopCapture(){
  this.stream.getTracks().forEach(track => track.stop());
  this.mediaRecorder = null;
  this.stream = null;
}

getMimeType(){
  const types = [
            "video/webm\;codecs=vp9", 
             "video/webm\;codecs=vp8", 
             "video/webm\;codecs=daala", 
             "video/webm\;codecs=h264", 
             "audio/webm\;codecs=opus", 
             "video/mpeg"];

for (let i in types) { 
  if(MediaRecorder.isTypeSupported(types[i]))
    return types[i];
  }  
}
  
recordStream(){
    const options = { mimeType: this.getMimeType() };
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
        const blob = new Blob(this.recordedChunks, {
          type: "video/webm"
        });

        if(this.stream) this.stopCapture();
        this.onRecordingStop(blob);
    };

    this.mediaRecorder.start();

  }
  
}