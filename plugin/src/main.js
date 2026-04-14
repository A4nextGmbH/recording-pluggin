import { cssStyles } from "./styles.js";
import { Recorder } from "./recorder.js";
import { submitReport } from "./api.js";

class BugReporter {
  constructor() {
    this.container = null;
    this.shadowRoot = null;
    this.recorder = new Recorder();
    this.appName = "Unknown App";
    this.apiUrl = "https://www.a4next.de";

    this.modalOverlay = null;
    this.recordBtn = null;
    this.videoPreview = null;
    this.indicator = null;
    this.indicatorTime = null;
    this.submitBtn = null;
    this.errorMsg = null;
    this.successMsg = null;
    this.form = null;

    // Make sure we only initialize once
    if (!window.__BugReporterInitialized) {
      window.__BugReporterInitialized = true;
      this.init();
    }
  }

  init() {
    // Read config from script tag
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute("src") || "";
      if (src.includes("plugin.js")) {
        this.appName = scripts[i].getAttribute("data-app-name") || this.appName;
        this.apiUrl = scripts[i].getAttribute("data-api-url") || this.apiUrl;
        this.apiUrl = this.apiUrl.replace(/\/$/, "");
        break;
      }
    }

    // if (document.currentScript) {
    //   this.appName =
    //     document.currentScript.getAttribute("data-app-name") || this.appName;
    //   this.apiUrl =
    //     document.currentScript.getAttribute("data-api-url") || this.apiUrl;
    //   this.apiUrl = this.apiUrl.replace(/\/$/, "");
    // }

    this.container = document.createElement("div");
    this.container.id = "bug-reporter-host";
    this.container.style.position = "fixed";
    this.container.style.zIndex = "999999";
    document.body.appendChild(this.container);

    this.shadowRoot = this.container.attachShadow({ mode: "open" });

    const styleElement = document.createElement("style");
    styleElement.textContent = cssStyles;
    this.shadowRoot.appendChild(styleElement);

    this.render();
  }

  render() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<button class="trigger-btn" id="br-trigger" type="button" aria-label="Fehler melden">
        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon points="6,4 20,12 6,20" fill="white"></polygon>
        </svg>
      </button>

      <div class="modal-overlay" id="br-modal">
        <div class="modal-content">
          <div class="header">
            <h2>Fehler melden</h2>
            <button class="close-btn" id="br-close" type="button" aria-label="Schließen">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="success-message" id="br-success"></div>

          <form id="br-form">
            <div class="form-group">
              <label for="br-title">Fehlerüberschrift *</label>
              <input type="text" id="br-title" class="input-field" placeholder="Kurz das Problem beschreiben..." required>
            </div>

            <div class="record-section" id="br-record-sec">
               <button class="record-btn" type="button" id="br-record-btn">Aufnahme starten</button>
               
               <div class="recording-indicator" id="br-indicator">
                 <div class="indicator-dot"></div>
                 Aufnahme... <span id="br-time">00:00</span>
               </div>

               <video class="video-preview" id="br-preview" controls></video>
               
               <div style="margin-top: 12px; display: none;" id="br-rerecord-wrap">
                 <button class="btn-secondary" type="button" id="br-rerecord-btn" style="padding: 6px 12px; font-size: 13px;">Verwerfen & neu aufnehmen</button>
               </div>
            </div>

            <div class="form-group">
              <label for="br-notes">Schritte zur Reproduktion / Notizen</label>
              <textarea id="br-notes" class="input-field" placeholder="Was haben Sie getan, als dies passiert ist?"></textarea>
            </div>
            
            <div class="error-message" id="br-error"></div>

            <div class="actions">
              <button type="button" class="btn-secondary" id="br-cancel-btn">Abbrechen</button>
              <button type="submit" class="btn-primary" id="br-submit-btn">Bericht absenden</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(wrapper);
    this.bindEvents();
  }

  bindEvents() {
    const $ = (id) => this.shadowRoot.getElementById(id);

    this.modalOverlay = $("br-modal");
    this.recordBtn = $("br-record-btn");
    this.videoPreview = $("br-preview");
    this.indicator = $("br-indicator");
    this.indicatorTime = $("br-time");
    this.submitBtn = $("br-submit-btn");
    this.errorMsg = $("br-error");
    this.successMsg = $("br-success");
    this.form = $("br-form");

    const triggerBtn = $("br-trigger");
    const closeBtn = $("br-close");
    const cancelBtn = $("br-cancel-btn");
    const rerecordBtn = $("br-rerecord-btn");
    const rerecordWrap = $("br-rerecord-wrap");

    const openModal = () => {
      this.modalOverlay.classList.add("open");
      this.successMsg.style.display = "none";
      this.form.style.display = "block";
      this.errorMsg.style.display = "none";
    };

    const closeModal = () => {
      this.modalOverlay.classList.remove("open");
      if (this.recordBtn.classList.contains("recording")) {
        this.stopRecording();
      }
    };

    triggerBtn.addEventListener("click", () => {
      if (this.recordBtn.classList.contains("recording")) {
        this.stopRecording();
        openModal();
      } else {
        openModal();
      }
    });

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    this.recordBtn.addEventListener("click", async () => {
      if (this.recordBtn.classList.contains("recording")) {
        this.stopRecording();
      } else {
        this.errorMsg.style.display = "none";
        const started = await this.recorder.startRecording((time) => {
          this.indicatorTime.innerText = time;
        });

        if (started) {
          this.recordBtn.classList.add("recording");
          this.recordBtn.innerText = "Aufnahme beenden";
          this.indicator.style.display = "flex";
          this.videoPreview.style.display = "none";
          rerecordWrap.style.display = "none";
          this.modalOverlay.classList.remove("open");
          // show a small dot on the trigger while recording
          triggerBtn.innerHTML = '<span class="indicator-dot" style="display:inline-block; margin:0"></span>';
          triggerBtn.classList.add("recording");
        } else {
          this.showError("Der Browser unterstützt keine Bildschirmaufnahme oder die Berechtigung wurde verweigert.");
        }
      }
    });

    rerecordBtn.addEventListener("click", () => {
      this.recorder.reset();
      this.videoPreview.style.display = "none";
      rerecordWrap.style.display = "none";
      this.recordBtn.style.display = "inline-block";
      this.recordBtn.classList.remove("recording");
      this.recordBtn.innerText = "Aufnahme starten";
    });

    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!this.recorder.getVideoBlob()) {
        this.showError("Bitte zeichnen Sie Ihren Bildschirm auf, bevor Sie senden.");
        return;
      }

      const title = $("br-title").value;
      const notes = $("br-notes").value;

      this.submitBtn.disabled = true;
      this.submitBtn.innerText = "Hochladen...";
      this.errorMsg.style.display = "none";

      try {
        await submitReport(this.apiUrl, {
          title,
          notes,
          appName: window.location.href,
          pageUrl: window.location.href,
          reportedAt: new Date().toISOString(),
          videoBlob: this.recorder.getVideoBlob(),
        });

        this.showSuccess("Bericht erfolgreich gesendet!");
        this.resetForm();
      } catch (err) {
        this.showError(err.message || "Fehler beim Senden des Berichts.");
      } finally {
        this.submitBtn.disabled = false;
        this.submitBtn.innerText = "Bericht absenden";
      }
    });
  }

  stopRecording() {
    this.recorder.stopRecording();
    this.recordBtn.classList.remove("recording");
    this.indicator.style.display = "none";
    this.recordBtn.style.display = "none";

    const triggerBtn = this.shadowRoot.getElementById("br-trigger");
    triggerBtn.classList.remove("recording");
    triggerBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon points="6,4 20,12 6,20" fill="white"></polygon>
        </svg>
    `;

    setTimeout(() => {
      const url = this.recorder.getVideoUrl();
      if (url) {
        this.videoPreview.src = url;
        this.videoPreview.style.display = "block";
        this.shadowRoot.getElementById("br-rerecord-wrap").style.display =
          "block";
      }
    }, 500);
  }

  showError(msg) {
    this.errorMsg.innerText = msg;
    this.errorMsg.style.display = "block";
  }

  showSuccess(msg) {
    this.form.style.display = "none";
    this.successMsg.innerText = msg;
    this.successMsg.style.display = "block";
    setTimeout(() => {
      this.shadowRoot.getElementById("br-modal").classList.remove("open");
      setTimeout(() => {
        this.form.style.display = "block";
        this.successMsg.style.display = "none";
      }, 300);
    }, 3000);
  }

  resetForm() {
    this.shadowRoot.getElementById("br-title").value = "";
    this.shadowRoot.getElementById("br-notes").value = "";
    this.recorder.reset();
    this.videoPreview.style.display = "none";
    this.shadowRoot.getElementById("br-rerecord-wrap").style.display = "none";
    this.recordBtn.style.display = "inline-block";
    this.recordBtn.classList.remove("recording");
    this.recordBtn.innerText = "Aufnahme starten";
  }
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new BugReporter());
  } else {
    new BugReporter();
  }
}
