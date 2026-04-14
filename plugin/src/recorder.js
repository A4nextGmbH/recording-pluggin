export class Recorder {
  constructor() {
    this.mediaRecorder = null;
    this.stream = null;
    this.chunks = [];
    this.videoBlob = null;
    this.startTime = null;
    this.timerInterval = null;
  }

  async startRecording(onTick) {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false // Usually don't need audio but could add if required
      });

      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm'
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.videoBlob = new Blob(this.chunks, { type: 'video/webm' });
        this.stopTracks();
        this.stopTimer();
      };

      this.mediaRecorder.start();
      
      this.startTime = Date.now();
      window.clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        onTick(`${mins}:${secs}`);
      }, 1000);

      return true;
    } catch (err) {
      console.error("Error accessing display media:", err);
      return false;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  stopTracks() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getVideoUrl() {
    if (!this.videoBlob) return null;
    return URL.createObjectURL(this.videoBlob);
  }

  getVideoBlob() {
    return this.videoBlob;
  }

  reset() {
    this.stopTracks();
    this.stopTimer();
    this.mediaRecorder = null;
    this.stream = null;
    this.chunks = [];
    this.videoBlob = null;
  }
}
