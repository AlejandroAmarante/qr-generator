/**
 * qr-engine.js — QR data building + code generation
 * Uses QRCode (from qrcore.js) directly — no wrapper class needed.
 */

const QREngine = {
  init(elements) {
    this.elements = elements;
    this.currentType = "url";
    this.currentQrData = "";
    this.qrGenerated = false;
    this.debounceTimer = null;
    // ── New appearance state ─────────────────────────────────────
    this.moduleShape = "square"; // "square" | "rounded" | "circle" | "diamond" | "star"
    this.logoDataUrl = null; // base64 data URL or null
    this.logoSizeRatio = 0.2; // fraction of module-grid width (0.10–0.35)
    this._addInputListeners();
    return this;
  },

  // ── Type state ───────────────────────────────────────────────────

  setType(type) {
    this.currentType = type;
  },
  getType() {
    return this.currentType;
  },

  // ── Appearance state setters ─────────────────────────────────────

  setModuleShape(shape) {
    this.moduleShape = shape;
    this.currentQrData = ""; // force full re-render on next update
  },

  setLogo(dataUrl, sizeRatio) {
    this.logoDataUrl = dataUrl;
    this.logoSizeRatio = Math.max(0.1, Math.min(0.3, sizeRatio || 0.2));
    this.currentQrData = "";
  },

  clearLogo() {
    this.logoDataUrl = null;
    this.logoSizeRatio = 0.2;
    this.currentQrData = "";
  },

  // ── Data builder ─────────────────────────────────────────────────

  buildQRData(type) {
    switch (type) {
      case "url": {
        const v = document.getElementById("url-input").value.trim();
        return v || "";
      }
      case "text": {
        const v = document.getElementById("text-input").value.trim();
        return v || "";
      }
      case "email": {
        const email = document.getElementById("email-address").value.trim();
        const subject = document.getElementById("email-subject").value.trim();
        const body = document.getElementById("email-body").value.trim();
        if (!email) return "";
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
        const msg = document.getElementById("sms-message").value.trim();
        if (!num) return "";
        return `smsto:${num}` + (msg ? `:${encodeURIComponent(msg)}` : "");
      }
      case "wifi": {
        const ssid = document.getElementById("wifi-ssid").value.trim();
        const pass = document.getElementById("wifi-password").value;
        const enc = document.getElementById("wifi-encryption").value;
        const hide = document.getElementById("wifi-hidden").checked;
        if (!ssid) return "";
        let d = `WIFI:S:${ssid};T:${enc};`;
        if (pass && enc !== "nopass") d += `P:${pass};`;
        if (hide) d += "H:true;";
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

  // ── Input listeners ──────────────────────────────────────────────

  _addInputListeners() {
    const root = document.getElementById("dynamic-fields");
    if (root) {
      const h = () => this._debounceUpdate();
      root.addEventListener("input", h);
      root.addEventListener("change", h);
    }
  },

  _debounceUpdate() {
    clearTimeout(this.debounceTimer);
    this.currentQrData = "";
    this.debounceTimer = setTimeout(() => this.updateQRCode(), 300);
  },

  // ── Generation ───────────────────────────────────────────────────

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
      parseInt(this.elements.qrSize.value),
      this.elements.qrColor.value,
      this.elements.qrBgcolor.value,
    );
  },

  _generate(data, ecLevel, size, fgColor, bgColor) {
    this.elements.qrPreview.innerHTML = "";

    try {
      if (typeof QRCode === "undefined") {
        throw new Error(
          'QRCode not found — make sure <script src="qrcore.js"> ' +
            'appears before <script type="module"> in index.html.',
        );
      }

      // ── Error-correction cascade ──────────────────────────────────
      // With a logo we MUST use H (30% restoration).  Q/M/L are not reliable
      // enough for the ~10–25% of module area the logo erases.  If the user
      // picked a specific level we honour it but warn loudly.
      const hasLogo = !!this.logoDataUrl;
      let levels;
      if (ecLevel === "A") {
        // Auto: lock to H when logo is active; full cascade otherwise.
        levels = hasLogo ? ["H"] : ["H", "Q", "M", "L"];
      } else {
        if (hasLogo && ecLevel !== "H" && ecLevel !== "Q") {
          console.warn(
            "[QREngine] Center logo is active but error correction is " +
              ecLevel +
              ". Scanning may fail. Use H for best results.",
          );
        }
        levels = [ecLevel];
      }

      // ── Minimum QR version when logo is active ────────────────────
      // With borderSize 0 format-information sits at module row/col 8.
      // The logo top edge = e*(1−ratio)/2.  For a 1-module safety margin:
      //
      //   e*(1−ratio)/2  >  9   →   e  >  18/(1−ratio)
      //
      // We need the smallest integer e that is STRICTLY greater than the
      // bound, which is  floor(18/(1−ratio)) + 1  (not ceil — ceil of an
      // exact integer would return the same integer, producing e = bound,
      // which fails the strict inequality).
      //
      // Converting e to a typeNumber: version = ceil((e − 17) / 4).
      // Using floor and subtracting 16 is equivalent to (floor(...)+1−17)/4:
      const clampedRatio = Math.min(this.logoSizeRatio || 0.2, 0.3);
      const minTypeNumber = hasLogo
        ? Math.max(1, Math.ceil((Math.floor(18 / (1 - clampedRatio)) - 16) / 4))
        : 1;

      let svgMarkup = null;
      let lastErr = null;

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
            // borderSize 0 removes the hardcoded internal SVG quiet zone.
            // Visual padding is handled entirely by the container CSS below,
            // giving the user real control via the padding slider.
            borderSize: 0,
            useSVG: true,
            moduleShape: this.moduleShape || "square",
            logoSrc: this.logoDataUrl || null,
            logoSizeRatio: this.logoSizeRatio || 0.2,
            // Start at the minimum safe version; makeCode() increments
            // automatically if the data needs a higher one.
            typeNumber: minTypeNumber,
          });

          const svg = host.querySelector("svg");
          if (svg) svgMarkup = svg.outerHTML;
        } catch (err) {
          lastErr = err;
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

      if (!svgMarkup) throw lastErr || new Error("Failed to generate QR code.");

      const container = document.createElement("div");
      container.id = "qr-code-container";
      container.innerHTML = svgMarkup;

      container.style.cssText = `
        display: inline-block;
        background-color: ${bgColor};
        padding: ${parseInt(this.elements.containerPadding.value)}px;
        border-radius: ${parseInt(this.elements.containerRadius.value)}px;
        overflow: hidden;
      `;

      this.elements.qrPreview.appendChild(container);
      this.qrGenerated = true;
      this.currentQrData = data;
      this.elements.downloadOptions.classList.remove("hidden");
    } catch (error) {
      this._showError(error.message);
      console.error("QR code generation error:", error);
    }
  },

  // ── UI helpers ───────────────────────────────────────────────────

  _showError(message) {
    this.elements.qrPreview.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "qr-message";
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "triangle-alert");
    const text = document.createElement("p");
    text.textContent = "Error: " + message;
    wrap.appendChild(icon);
    wrap.appendChild(text);
    this.elements.qrPreview.appendChild(wrap);
    this.elements.downloadOptions.classList.add("hidden");
    if (typeof lucide !== "undefined") lucide.createIcons();
  },

  reset() {
    this.currentQrData = "";
    this.qrGenerated = false;
    this.elements.qrPreview.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "qr-message";
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "qr-code");
    const text = document.createElement("p");
    text.textContent = "Your QR code will appear here";
    wrap.appendChild(icon);
    wrap.appendChild(text);
    this.elements.qrPreview.appendChild(wrap);
    this.elements.downloadOptions.classList.add("hidden");
    if (typeof lucide !== "undefined") lucide.createIcons();
  },
};

export default QREngine;
