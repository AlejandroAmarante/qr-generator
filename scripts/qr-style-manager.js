// QR Style Manager
const QRStyleManager = {
  // Initialize the manager with DOM elements
  init(elements, qrGenerator) {
    this.elements = elements;
    this.qrGenerator = qrGenerator;

    // Set initial display values for range inputs
    if (this.elements.radiusValue)
      this.elements.radiusValue.textContent =
        this.elements.containerRadius.value + "px";

    if (this.elements.paddingValue)
      this.elements.paddingValue.textContent =
        this.elements.containerPadding.value + "px";

    // Add style-related event listeners
    this._addStyleListeners();

    return this;
  },

  resetToDefaults() {
    // Reset form values
    this.elements.qrErrorCorrectionLevel.value = "A";
    this.elements.qrSize.value = "200";
    this.elements.qrColor.value = "#000000";
    this.elements.qrBgcolor.value = "#FFFFFF";
    this.elements.containerRadius.value = "5";
    this.elements.containerPadding.value = "1";

    // Update display values
    this.elements.radiusValue.textContent = "5px";
    this.elements.paddingValue.textContent = "1px";

    // Trigger QR code update
    if (this.qrGenerator.qrGenerated) {
      this.qrGenerator.currentQrData = "";
      this.qrGenerator.updateQRCode();
    }
  },

  // Add event listeners for style controls
  _addStyleListeners() {
    // QR color
    this.elements.qrColor.addEventListener("input", () => {
      if (this.qrGenerator.qrGenerated) {
        this.qrGenerator.currentQrData = "";
        this.qrGenerator.updateQRCode();
      }
    });

    // QR background color
    this.elements.qrBgcolor.addEventListener("input", () => {
      if (this.qrGenerator.qrGenerated) {
        this.qrGenerator.currentQrData = "";
        this.qrGenerator.updateQRCode();
      }
    });

    // QR error correction level
    this.elements.qrErrorCorrectionLevel.addEventListener("input", () => {
      if (this.qrGenerator.qrGenerated) {
        this.qrGenerator.currentQrData = "";
        this.qrGenerator.updateQRCode();
      }
    });

    // QR size
    this.elements.qrSize.addEventListener("input", () => {
      if (this.qrGenerator.qrGenerated) {
        this.qrGenerator.currentQrData = "";
        this.qrGenerator.updateQRCode();
      }
    });

    // Container radius
    this.elements.containerRadius.addEventListener("input", () => {
      this.elements.radiusValue.textContent =
        this.elements.containerRadius.value + "px";
      if (this.qrGenerator.qrGenerated) {
        this.qrGenerator.currentQrData = "";
        this.qrGenerator.updateQRCode();
      }
    });

    // Container padding
    this.elements.containerPadding.addEventListener("input", () => {
      this.elements.paddingValue.textContent =
        this.elements.containerPadding.value + "px";
      if (this.qrGenerator.qrGenerated) {
        this.qrGenerator.currentQrData = "";
        this.qrGenerator.updateQRCode();
      }
    });

    this.elements.resetDesignBtn.addEventListener("click", () => {
      this.resetToDefaults();
    });
  },
};

export default QRStyleManager;
