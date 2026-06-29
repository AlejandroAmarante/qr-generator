/**
 * ui-controls.js — Type selector + style controls + shape selector + logo upload
 * Merges type-selector.js and qr-style-manager.js, extended with
 * module-shape selection and center-logo upload/clear/resize.
 */
const UIControls = {
  init(elements, qrEngine) {
    this.elements = elements;
    this.qrEngine = qrEngine;

    // Sync slider display values to their input defaults on load.
    if (elements.radiusValue)
      elements.radiusValue.textContent = elements.containerRadius.value + "px";
    if (elements.paddingValue)
      elements.paddingValue.textContent =
        elements.containerPadding.value + "px";

    // Cache new DOM elements (queried directly — not passed via app.js elements).
    this._shapeBtns = document.querySelectorAll(".shape-btn");
    this._logoUpload = document.getElementById("logo-upload");
    this._logoRemove = document.getElementById("logo-remove");
    this._logoSize = document.getElementById("logo-size");
    this._logoSizeVal = document.getElementById("logo-size-value");
    this._logoSizeGrp = document.getElementById("logo-size-group");
    this._logoFilename = document.getElementById("logo-filename");
    this._logoUploadTxt = document.getElementById("logo-upload-text");

    this._addTypeButtonListeners();
    this._addStyleListeners();
    this._addShapeListeners();
    this._addLogoListeners();
    return this;
  },

  // ── Type selector (was type-selector.js) ────────────────────────
  _addTypeButtonListeners() {
    this.elements.typeButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const type = event.target.closest("button")?.getAttribute("data-type");
        if (type) this.selectType(type);
      });
    });
  },

  selectType(type) {
    this.elements.typeButtons.forEach((btn) => btn.classList.remove("active"));
    const activeBtn = Array.from(this.elements.typeButtons).find(
      (btn) => btn.getAttribute("data-type") === type,
    );
    if (activeBtn) activeBtn.classList.add("active");

    Object.values(this.elements.formFields).forEach((f) =>
      f.classList.add("hidden"),
    );
    if (this.elements.formFields[type]) {
      this.elements.formFields[type].classList.remove("hidden");
    }

    this.qrEngine.setType(type);
    this.qrEngine.reset();
    setTimeout(() => this.qrEngine.updateQRCode(), 10);
  },

  // ── Style controls (was qr-style-manager.js) ────────────────────
  resetToDefaults() {
    // Existing style resets
    this.elements.qrErrorCorrectionLevel.value = "A";
    this.elements.qrSize.value = "200";
    this.elements.qrColor.value = "#000000";
    this.elements.qrBgcolor.value = "#FFFFFF";
    this.elements.containerRadius.value = "5";
    this.elements.containerPadding.value = "8";
    this.elements.radiusValue.textContent = "5px";
    this.elements.paddingValue.textContent = "8px";

    // Reset module shape → square
    this._shapeBtns.forEach((b) => b.classList.remove("active"));
    const squareBtn = Array.from(this._shapeBtns).find(
      (b) => b.getAttribute("data-shape") === "square",
    );
    if (squareBtn) squareBtn.classList.add("active");
    this.qrEngine.setModuleShape("square");

    // Reset logo
    if (this._logoUpload) this._logoUpload.value = "";
    if (this._logoUploadTxt)
      this._logoUploadTxt.textContent = "Upload image or SVG";
    if (this._logoFilename) this._logoFilename.textContent = "";
    if (this._logoRemove) this._logoRemove.classList.add("hidden");
    if (this._logoSizeGrp) this._logoSizeGrp.classList.add("hidden");
    if (this._logoSize) this._logoSize.value = "20";
    if (this._logoSizeVal) this._logoSizeVal.textContent = "20%";
    this.qrEngine.clearLogo();

    if (this.qrEngine.qrGenerated) {
      this.qrEngine.currentQrData = "";
      this.qrEngine.updateQRCode();
    }
  },

  _addStyleListeners() {
    const refresh = () => {
      if (this.qrEngine.qrGenerated) {
        this.qrEngine.currentQrData = "";
        this.qrEngine.updateQRCode();
      }
    };
    this.elements.qrColor.addEventListener("input", refresh);
    this.elements.qrBgcolor.addEventListener("input", refresh);
    this.elements.qrErrorCorrectionLevel.addEventListener("input", refresh);
    this.elements.qrSize.addEventListener("input", refresh);
    this.elements.containerRadius.addEventListener("input", () => {
      this.elements.radiusValue.textContent =
        this.elements.containerRadius.value + "px";
      refresh();
    });
    this.elements.containerPadding.addEventListener("input", () => {
      this.elements.paddingValue.textContent =
        this.elements.containerPadding.value + "px";
      refresh();
    });
    this.elements.resetDesignBtn.addEventListener("click", () =>
      this.resetToDefaults(),
    );
  },

  // ── Module shape selector ────────────────────────────────────────
  _addShapeListeners() {
    this._shapeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const shape = btn.getAttribute("data-shape");
        if (!shape) return;

        this._shapeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.qrEngine.setModuleShape(shape);

        // Re-render immediately if a QR code is already showing.
        if (this.qrEngine.qrGenerated) {
          this.qrEngine.updateQRCode();
        }
      });
    });
  },

  // ── Logo upload / remove / resize ───────────────────────────────
  _addLogoListeners() {
    if (!this._logoUpload) return;

    // File chosen — read as data URL and pass to engine.
    this._logoUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const sizeRatio = parseInt(this._logoSize?.value || "20") / 100;

        this.qrEngine.setLogo(dataUrl, sizeRatio);

        // Update UI chrome.
        if (this._logoUploadTxt)
          this._logoUploadTxt.textContent = "Change image";
        if (this._logoFilename) this._logoFilename.textContent = file.name;
        if (this._logoRemove) this._logoRemove.classList.remove("hidden");
        if (this._logoSizeGrp) this._logoSizeGrp.classList.remove("hidden");

        this.qrEngine.updateQRCode();

        // Re-init lucide so newly-visible icons render.
        if (typeof lucide !== "undefined") lucide.createIcons();
      };
      reader.readAsDataURL(file);
    });

    // Remove logo button.
    if (this._logoRemove) {
      this._logoRemove.addEventListener("click", () => {
        this.qrEngine.clearLogo();

        // Reset file input so the same file can be re-selected later.
        this._logoUpload.value = "";
        if (this._logoUploadTxt)
          this._logoUploadTxt.textContent = "Upload image or SVG";
        if (this._logoFilename) this._logoFilename.textContent = "";
        this._logoRemove.classList.add("hidden");
        if (this._logoSizeGrp) this._logoSizeGrp.classList.add("hidden");

        this.qrEngine.updateQRCode();
      });
    }

    // Logo size slider — live update.
    if (this._logoSize) {
      this._logoSize.addEventListener("input", () => {
        const sizeRatio = parseInt(this._logoSize.value) / 100;
        if (this._logoSizeVal)
          this._logoSizeVal.textContent = this._logoSize.value + "%";

        // Only update if a logo is currently loaded.
        if (this.qrEngine.logoDataUrl) {
          this.qrEngine.setLogo(this.qrEngine.logoDataUrl, sizeRatio);
          this.qrEngine.updateQRCode();
        }
      });
    }
  },
};

export default UIControls;
