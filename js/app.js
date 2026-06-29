/**
 * app.js — Application entry point
 * Merges main.js (orchestration) and dom-elements.js (DOM refs).
 * DOM refs belong in the bootstrap file, not their own 30-line module.
 */
import QREngine from "./qr-engine.js";
import UIControls from "./ui-controls.js";
import DownloadManager from "./download.js";

const QRCodeApp = {
  init() {
    document.addEventListener("DOMContentLoaded", () => {
      // ── DOM references (was dom-elements.js) ──────────────────────
      const elements = {
        typeButtons: document.querySelectorAll(".type-btn"),
        qrPreview: document.getElementById("qr-preview"),
        qrMessage: document.getElementById("qr-message"),
        downloadOptions: document.getElementById("download-options"),
        downloadSvgBtn: document.getElementById("download-svg"),
        downloadPngBtn: document.getElementById("download-png"),
        qrErrorCorrectionLevel: document.getElementById(
          "qr-error-correction-level",
        ),
        qrSize: document.getElementById("qr-size"),
        qrColor: document.getElementById("qr-color"),
        qrBgcolor: document.getElementById("qr-bgcolor"),
        containerRadius: document.getElementById("container-radius"),
        containerPadding: document.getElementById("container-padding"),
        radiusValue: document.getElementById("radius-value"),
        paddingValue: document.getElementById("padding-value"),
        resetDesignBtn: document.getElementById("reset-design"),
        formFields: {
          url: document.getElementById("url-fields"),
          text: document.getElementById("text-fields"),
          email: document.getElementById("email-fields"),
          phone: document.getElementById("phone-fields"),
          sms: document.getElementById("sms-fields"),
          wifi: document.getElementById("wifi-fields"),
          vcard: document.getElementById("vcard-fields"),
        },
      };

      // ── Wire up modules ────────────────────────────────────────────
      const qrEngine = QREngine.init(elements);
      DownloadManager.init(elements);
      UIControls.init(elements, qrEngine);

      // Trigger an initial render pass in case fields are pre-filled.
      setTimeout(() => {
        qrEngine.currentQrData = "";
        qrEngine.updateQRCode();
      }, 100);
    });
  },
};

QRCodeApp.init();
