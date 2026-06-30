/**
 * qr-engine.js — QR data building + code generation
 *
 * Depends on window.QRCode being available (loaded via qrcore.js before
 * any module script runs).
 */

const QREngine = {
  // ── Initialisation ───────────────────────────────────────────────────────

  init(elements) {
    this.elements = elements;
    this.currentType = "url";
    this.currentQrData = "";
    this.qrGenerated = false;
    this.debounceTimer = null;

    // Appearance state — mutated by UIControls
    this.moduleShape = "square"; // "square" | "rounded" | "circle" | "diamond" | "star"
    this.logoDataUrl = null; // base-64 data URL, or null
    this.logoSizeRatio = 0.2; // fraction of the module-grid width (0.10–0.30)

    this._addInputListeners();
    return this;
  },

  // ── Type state ───────────────────────────────────────────────────────────

  setType(type) {
    this.currentType = type;
  },

  getType() {
    return this.currentType;
  },

  // ── Appearance state ─────────────────────────────────────────────────────

  setModuleShape(shape) {
    this.moduleShape = shape;
    this.currentQrData = ""; // force full re-render
  },

  setLogo(dataUrl, sizeRatio) {
    this.logoDataUrl = dataUrl;
    this.logoSizeRatio = Math.max(0.1, Math.min(0.3, sizeRatio ?? 0.2));
    this.currentQrData = "";
  },

  clearLogo() {
    this.logoDataUrl = null;
    this.logoSizeRatio = 0.2;
    this.currentQrData = "";
  },

  // ── Data builder ─────────────────────────────────────────────────────────

  buildQRData(type) {
    switch (type) {
      case "url": {
        return document.getElementById("url-input").value.trim();
      }
      case "text": {
        return document.getElementById("text-input").value.trim();
      }
      case "email": {
        const email = document.getElementById("email-address").value.trim();
        if (!email) return "";
        const subject = document.getElementById("email-subject").value.trim();
        const body = document.getElementById("email-body").value.trim();
        let d = `mailto:${email}`;
        if (subject) d += `?subject=${encodeURIComponent(subject)}`;
        if (body) d += `${subject ? "&" : "?"}body=${encodeURIComponent(body)}`;
        return d;
      }
      case "phone": {
        const v = document.getElementById("phone-input").value.trim();
        return v ? `tel:${v}` : "";
      }
      case "sms": {
        const num = document.getElementById("sms-number").value.trim();
        if (!num) return "";
        const msg = document.getElementById("sms-message").value.trim();
        return `smsto:${num}` + (msg ? `:${encodeURIComponent(msg)}` : "");
      }
      case "wifi": {
        const ssid = document.getElementById("wifi-ssid").value.trim();
        if (!ssid) return "";
        const pass = document.getElementById("wifi-password").value;
        const enc = document.getElementById("wifi-encryption").value;
        const hidden = document.getElementById("wifi-hidden").checked;
        let d = `WIFI:S:${ssid};T:${enc};`;
        if (pass && enc !== "nopass") d += `P:${pass};`;
        if (hidden) d += "H:true;";
        return d + ";";
      }
      case "vcard": {
        const name = document.getElementById("vcard-name").value.trim();
        const phone = document.getElementById("vcard-phone").value.trim();
        const email = document.getElementById("vcard-email").value.trim();
        if (!name || !phone || !email) return "";
        const co = document.getElementById("vcard-company").value.trim();
        const ti = document.getElementById("vcard-title").value.trim();
        const web = document.getElementById("vcard-website").value.trim();
        const addr = document.getElementById("vcard-address").value.trim();
        let d = "BEGIN:VCARD\nVERSION:3.0\n";
        d += `FN:${name}\n`;
        if (co) d += `ORG:${co}\n`;
        if (ti) d += `TITLE:${ti}\n`;
        d += `TEL:${phone}\n`;
        d += `EMAIL:${email}\n`;
        if (web) d += `URL:${web}\n`;
        if (addr) d += `ADR:;;${addr};;;\n`;
        return d + "END:VCARD";
      }
      default:
        return "";
    }
  },

  // ── Input listeners ──────────────────────────────────────────────────────

  _addInputListeners() {
    // Event delegation on the dynamic-fields container covers all type forms.
    const root = document.getElementById("dynamic-fields");
    if (!root) return;
    const debounce = () => this._debounceUpdate();
    root.addEventListener("input", debounce);
    root.addEventListener("change", debounce);
  },

  _debounceUpdate() {
    clearTimeout(this.debounceTimer);
    this.currentQrData = "";
    this.debounceTimer = setTimeout(() => this.updateQRCode(), 300);
  },

  // ── Generation ───────────────────────────────────────────────────────────

  updateQRCode() {
    const type = this.getType();
    const data = this.buildQRData(type);

    if (!data) {
      this.reset();
      return;
    }
    if (data === this.currentQrData && this.qrGenerated) return;

    this._generate(
      data,
      this.elements.qrErrorCorrectionLevel.value,
      parseInt(this.elements.qrSize.value, 10),
      this.elements.qrColor.value,
      this.elements.qrBgcolor.value,
    );
  },

  _generate(data, ecLevel, size, fgColor, bgColor) {
    this.elements.qrPreview.innerHTML = "";

    try {
      if (typeof QRCode === "undefined") {
        throw new Error(
          'QRCode not found — ensure <script src="lib/qrcore.js"> ' +
            "appears before the module script in index.html.",
        );
      }

      // ── Error-correction level selection ──────────────────────────────
      // When a logo is active we strongly prefer H (30% restoration capacity)
      // because the logo physically erases ~10–25% of the module area.
      // "Auto" mode locks to H with a logo; without one it cascades H→Q→M→L
      // so the smallest valid version is chosen automatically.
      const hasLogo = !!this.logoDataUrl;
      let levels;
      if (ecLevel === "A") {
        levels = hasLogo ? ["H"] : ["H", "Q", "M", "L"];
      } else {
        if (hasLogo && ecLevel !== "H" && ecLevel !== "Q") {
          console.warn(
            `[QREngine] Center logo is active but error correction is "${ecLevel}". ` +
              "Scanning may fail. Use H or Q for best results.",
          );
        }
        levels = [ecLevel];
      }

      // ── Minimum safe QR version when a logo is active ─────────────────
      // The logo erases the centre of the code. To keep the finder patterns
      // (which sit at module row/col 0–6 and n-7–n) intact, the logo's top
      // edge must clear row 9 (format-info row + 1 safety module):
      //
      //   moduleCount × (1 − logoSizeRatio) / 2  >  9
      //   → moduleCount  >  18 / (1 − logoSizeRatio)
      //
      // moduleCount = 4 × version + 17, so:
      //   version  >  (18 / (1 − ratio) − 17) / 4
      //
      // We take floor of the bound then add 1 to satisfy the strict inequality,
      // giving the smallest integer version that clears the format-info row.
      const clampedRatio = Math.min(this.logoSizeRatio ?? 0.2, 0.3);
      const minTypeNumber = hasLogo
        ? Math.max(1, Math.ceil((Math.floor(18 / (1 - clampedRatio)) - 16) / 4))
        : 1;

      let svgMarkup = null;
      let lastError = null;

      for (const level of levels) {
        const host = document.createElement("div");
        host.style.cssText =
          "position:absolute;left:-9999px;top:-9999px;visibility:hidden;";
        document.body.appendChild(host);

        try {
          new QRCode(host, {
            text: data,
            width: size,
            height: size,
            colorDark: fgColor,
            colorLight: bgColor,
            correctLevel: QRCode.CorrectLevel[level],
            // borderSize 0 removes the library's built-in quiet zone so the
            // container padding slider gives the user precise control.
            borderSize: 0,
            useSVG: true,
            moduleShape: this.moduleShape,
            logoSrc: this.logoDataUrl,
            logoSizeRatio: this.logoSizeRatio,
            typeNumber: minTypeNumber,
          });

          const svg = host.querySelector("svg");
          if (svg) svgMarkup = svg.outerHTML;
        } catch (err) {
          lastError = err;
          // Only swallow overflow errors; anything else is a real bug.
          if (
            !err.message.includes("too long") &&
            !err.message.includes("overflow")
          ) {
            throw err;
          }
        } finally {
          document.body.removeChild(host);
        }

        if (svgMarkup) break;
      }

      if (!svgMarkup) {
        throw lastError ?? new Error("Failed to generate QR code.");
      }

      const container = this._buildContainer(svgMarkup, bgColor);
      this.elements.qrPreview.appendChild(container);
      this.qrGenerated = true;
      this.currentQrData = data;
      this.elements.downloadOptions.classList.remove("hidden");
    } catch (error) {
      this._showError(error.message);
      console.error("QR code generation error:", error);
    }
  },

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Wraps the raw SVG markup in a styled container div.
   * Extracting this keeps _generate() focused on logic, not presentation.
   */
  _buildContainer(svgMarkup, bgColor) {
    const container = document.createElement("div");
    container.id = "qr-code-container";
    container.innerHTML = svgMarkup;

    const padding = parseInt(this.elements.containerPadding.value, 10);
    const radius = parseInt(this.elements.containerRadius.value, 10);

    container.style.display = "inline-block";
    container.style.backgroundColor = bgColor;
    container.style.padding = `${padding}px`;
    container.style.borderRadius = `${radius}px`;
    container.style.overflow = "hidden";

    return container;
  },

  _showError(message) {
    this.elements.qrPreview.innerHTML = "";
    this.elements.qrPreview.appendChild(
      this._buildMessage("triangle-alert", `Error: ${message}`),
    );
    this.elements.downloadOptions.classList.add("hidden");
    if (typeof lucide !== "undefined") lucide.createIcons();
  },

  reset() {
    this.currentQrData = "";
    this.qrGenerated = false;
    this.elements.qrPreview.innerHTML = "";
    this.elements.qrPreview.appendChild(
      this._buildMessage("qr-code", "Your QR code will appear here"),
    );
    this.elements.downloadOptions.classList.add("hidden");
    if (typeof lucide !== "undefined") lucide.createIcons();
  },

  /** Creates the icon + text placeholder/error markup used by reset and _showError. */
  _buildMessage(iconName, text) {
    const wrap = document.createElement("div");
    wrap.className = "qr-message";

    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", iconName);
    icon.setAttribute("aria-hidden", "true");

    const p = document.createElement("p");
    p.textContent = text;

    wrap.appendChild(icon);
    wrap.appendChild(p);
    return wrap;
  },
};

export default QREngine;
