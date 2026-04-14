export class Recorder {
  constructor() {
    this.mediaRecorder = null;
    this.stream = null;
    this.chunks = [];
    this.videoBlob = null;
    this.startTime = null;
    this.timerInterval = null;
    this._micStream = null;
  }

  // options: { audio: boolean } - when true, capture microphone audio and mix with display
  async startRecording(onTick, options = { audio: false }) {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false // we will add mic audio separately when requested
      });

      let combinedStream = null;

      if (options.audio) {
        try {
          this._micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (micErr) {
          console.error('Microphone access denied or not available:', micErr);
          // fallback to display-only if mic fails
          this._micStream = null;
        }
      }

      if (this._micStream && this._micStream.getAudioTracks().length > 0) {
        // combine video tracks from display with audio tracks from mic
        combinedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...this._micStream.getAudioTracks()
        ]);
      } else {
        // no mic, use display-only stream (may include system audio depending on browser)
        combinedStream = displayStream;
      }

      this.stream = combinedStream;

      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
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
    if (this._micStream) {
      this._micStream.getTracks().forEach(t => t.stop());
      this._micStream = null;
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
