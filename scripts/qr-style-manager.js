// QR Style Manager
const QRStyleManager = {
  // Initialize the manager with DOM elements
  init(elements, qrGenerator) {
    this.elements = elements;
    this.qrGenerator = qrGenerator;

    // Set initial display values for range inputs
    if (this.elements.radiusValue) 
      this.elements.radiusValue.textContent = this.elements.containerRadius.value + "px";
    
    if (this.elements.paddingValue)
      this.elements.paddingValue.textContent = this.elements.containerPadding.value + "px";
    
    // Add style-related event listeners
    this._addStyleListeners();
    
    return this;
  },

  // Update container styling
  updateContainerStyle() {
    const qrContainer = document.getElementById("qr-code-container");
    if (qrContainer) {
      qrContainer.style.backgroundColor = this.elements.qrBgcolor.value;
      qrContainer.style.borderRadius = this.elements.containerRadius.value + "px";
      qrContainer.style.padding = this.elements.containerPadding.value + "px";
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
        this.updateContainerStyle();
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
      this.elements.radiusValue.textContent = this.elements.containerRadius.value + "px";
      if (this.qrGenerator.qrGenerated) {
        this.updateContainerStyle();
      }
    });

    // Container padding
    this.elements.containerPadding.addEventListener("input", () => {
      this.elements.paddingValue.textContent = this.elements.containerPadding.value + "px";
      if (this.qrGenerator.qrGenerated) {
        this.updateContainerStyle();
      }
    });
  }
};

export default QRStyleManager;
