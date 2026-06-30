/**
 * app.js — Application entry point
 *
 * type="module" scripts are deferred by the HTML spec: the parser finishes
 * building the DOM before evaluating this file. No DOMContentLoaded wrapper
 * is necessary.
 */
import QREngine from "./qr-engine.js";
import UIControls from "./ui-controls.js";
import DownloadManager from "./download.js";

// ── DOM references ─────────────────────────────────────────────────────────
// Collected once here so every module receives the same set of stable refs,
// rather than each module querying the DOM independently.
const elements = {
  typeButtons: document.querySelectorAll(".type-btn"),
  qrPreview: document.getElementById("qr-preview"),
  qrMessage: document.getElementById("qr-message"),
  downloadOptions: document.getElementById("download-options"),
  downloadSvgBtn: document.getElementById("download-svg"),
  downloadPngBtn: document.getElementById("download-png"),
  qrErrorCorrectionLevel: document.getElementById("qr-error-correction-level"),
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

// ── Bootstrap ──────────────────────────────────────────────────────────────
const engine = QREngine.init(elements);
DownloadManager.init(elements);
UIControls.init(elements, engine);

// Render Lucide icons — converts every <i data-lucide="…"> in the document,
// including the placeholder icon inside #qr-preview.
if (typeof lucide !== "undefined") {
  lucide.createIcons();
}
