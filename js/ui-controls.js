/**
 * ui-controls.js — Type selector · style controls · shape selector · logo upload
 */
const UIControls = {
  init(elements, qrEngine) {
    this.elements = elements;
    this.qrEngine = qrEngine;

    // Sync slider display values to their HTML default values on load.
    if (elements.radiusValue) {
      elements.radiusValue.textContent = `${elements.containerRadius.value}px`;
    }
    if (elements.paddingValue) {
      elements.paddingValue.textContent = `${elements.containerPadding.value}px`;
    }

    // Cache DOM elements that aren't passed through the shared elements object.
    this._shapeBtns = document.querySelectorAll(".shape-btn");
    this._logoUpload = document.getElementById("logo-upload");
    this._logoRemove = document.getElementById("logo-remove");
    this._logoSize = document.getElementById("logo-size");
    this._logoSizeVal = document.getElementById("logo-size-value");
    this._logoSizeGrp = document.getElementById("logo-size-group");
    this._logoFilename = document.getElementById("logo-filename");
    this._logoUploadTxt = document.getElementById("logo-upload-text");

    this._bindTypeButtons();
    this._bindStyleControls();
    this._bindShapeButtons();
    this._bindLogoControls();

    return this;
  },

  // ── Type selector ────────────────────────────────────────────────────────

  _bindTypeButtons() {
    this.elements.typeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const type = e.currentTarget.getAttribute("data-type");
        if (type) this.selectType(type);
      });
    });
  },

  selectType(type) {
    // Update active button state.
    this.elements.typeButtons.forEach((btn) => btn.classList.remove("active"));
    const activeBtn = Array.from(this.elements.typeButtons).find(
      (btn) => btn.getAttribute("data-type") === type,
    );
    activeBtn?.classList.add("active");

    // Show only the matching field section.
    Object.values(this.elements.formFields).forEach((f) =>
      f.classList.add("hidden"),
    );
    this.elements.formFields[type]?.classList.remove("hidden");

    this.qrEngine.setType(type);
    this.qrEngine.reset();
    // Small delay lets the browser paint the newly visible fields before
    // updateQRCode reads their values.
    setTimeout(() => this.qrEngine.updateQRCode(), 10);
  },

  // ── Style controls ───────────────────────────────────────────────────────

  _bindStyleControls() {
    const { elements, qrEngine } = this;

    const refresh = () => {
      if (!qrEngine.qrGenerated) return;
      qrEngine.currentQrData = "";
      qrEngine.updateQRCode();
    };

    elements.qrColor.addEventListener("input", refresh);
    elements.qrBgcolor.addEventListener("input", refresh);
    elements.qrErrorCorrectionLevel.addEventListener("change", refresh);
    elements.qrSize.addEventListener("change", refresh);

    elements.containerRadius.addEventListener("input", () => {
      elements.radiusValue.textContent = `${elements.containerRadius.value}px`;
      refresh();
    });

    elements.containerPadding.addEventListener("input", () => {
      elements.paddingValue.textContent = `${elements.containerPadding.value}px`;
      refresh();
    });

    elements.resetDesignBtn.addEventListener("click", () =>
      this.resetToDefaults(),
    );
  },

  resetToDefaults() {
    const { elements, qrEngine } = this;

    // Restore all style controls to their default values.
    elements.qrErrorCorrectionLevel.value = "A";
    elements.qrSize.value = "200";
    elements.qrColor.value = "#000000";
    elements.qrBgcolor.value = "#FFFFFF";
    elements.containerRadius.value = "5";
    elements.containerPadding.value = "8";
    elements.radiusValue.textContent = "5px";
    elements.paddingValue.textContent = "8px";

    // Reset module shape → square.
    this._shapeBtns.forEach((b) => b.classList.remove("active"));
    this._shapeBtns.forEach((b) => {
      if (b.getAttribute("data-shape") === "square") b.classList.add("active");
    });
    qrEngine.setModuleShape("square");

    // Reset logo.
    if (this._logoUpload) this._logoUpload.value = "";
    if (this._logoUploadTxt)
      this._logoUploadTxt.textContent = "Upload image or SVG";
    if (this._logoFilename) this._logoFilename.textContent = "";
    this._logoRemove?.classList.add("hidden");
    this._logoSizeGrp?.classList.add("hidden");
    if (this._logoSize) this._logoSize.value = "20";
    if (this._logoSizeVal) this._logoSizeVal.textContent = "20%";
    qrEngine.clearLogo();

    if (qrEngine.qrGenerated) {
      qrEngine.currentQrData = "";
      qrEngine.updateQRCode();
    }
  },

  // ── Module shape selector ────────────────────────────────────────────────

  _bindShapeButtons() {
    this._shapeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const shape = btn.getAttribute("data-shape");
        if (!shape) return;

        this._shapeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.qrEngine.setModuleShape(shape);

        if (this.qrEngine.qrGenerated) {
          this.qrEngine.updateQRCode();
        }
      });
    });
  },

  // ── Logo upload / remove / resize ────────────────────────────────────────

  _bindLogoControls() {
    if (!this._logoUpload) return;

    // File chosen — read as data URL and pass to the engine.
    this._logoUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const sizeRatio = parseInt(this._logoSize?.value ?? "20", 10) / 100;
        this.qrEngine.setLogo(ev.target.result, sizeRatio);

        if (this._logoUploadTxt)
          this._logoUploadTxt.textContent = "Change image";
        if (this._logoFilename) this._logoFilename.textContent = file.name;
        this._logoRemove?.classList.remove("hidden");
        this._logoSizeGrp?.classList.remove("hidden");

        this.qrEngine.updateQRCode();
        if (typeof lucide !== "undefined") lucide.createIcons();
      };
      reader.readAsDataURL(file);
    });

    // Remove logo.
    this._logoRemove?.addEventListener("click", () => {
      this.qrEngine.clearLogo();
      if (this._logoUpload) this._logoUpload.value = "";
      if (this._logoUploadTxt)
        this._logoUploadTxt.textContent = "Upload image or SVG";
      if (this._logoFilename) this._logoFilename.textContent = "";
      this._logoRemove.classList.add("hidden");
      this._logoSizeGrp?.classList.add("hidden");
      this.qrEngine.updateQRCode();
    });

    // Logo size slider — live update while logo is loaded.
    this._logoSize?.addEventListener("input", () => {
      const sizeRatio = parseInt(this._logoSize.value, 10) / 100;
      if (this._logoSizeVal)
        this._logoSizeVal.textContent = `${this._logoSize.value}%`;
      if (this.qrEngine.logoDataUrl) {
        this.qrEngine.setLogo(this.qrEngine.logoDataUrl, sizeRatio);
        this.qrEngine.updateQRCode();
      }
    });
  },
};

export default UIControls;
