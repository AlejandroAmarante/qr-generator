// QR Generator
const QRGenerator = {
  // Initialize the generator
  init(elements, dataHandler, styleManager) {
    this.elements = elements;
    this.dataHandler = dataHandler;
    this.styleManager = styleManager;

    this.currentQrData = "";
    this.qrGenerated = false;
    this.debounceTimer = null;

    // Add input listeners
    this._addInputListeners();

    return this;
  },

  // Add event listeners to all form input fields
  _addInputListeners() {
    const formContainer = document.querySelector(".qr-type-fields");
    if (formContainer) {
      const updateHandler = () => this._debounceUpdate();
      formContainer.addEventListener("input", updateHandler);
      formContainer.addEventListener("change", updateHandler);
    }
  },

  // Debounce function to prevent too many updates
  _debounceUpdate() {
    clearTimeout(this.debounceTimer);
    this.currentQrData = "";
    this.debounceTimer = setTimeout(() => this.updateQRCode(), 300);
  },

  // Update QR code function
  updateQRCode() {
    const type = this.dataHandler.getType();
    const data = this.dataHandler.buildQRData(type);

    if (!data) {
      this.reset();
      return;
    }

    if (data === this.currentQrData && this.qrGenerated) return;

    const errorCorrectLevel = this.elements.qrErrorCorrectionLevel.value;
    const size = parseInt(this.elements.qrSize.value);
    const color = this.elements.qrColor.value;
    const bgcolor = this.elements.qrBgcolor.value;

    this.generateQrCodeWithLibrary(
      data,
      errorCorrectLevel,
      size,
      color,
      bgcolor
    );
  },

  // Function to generate QR code using the new QRCore library
  async generateQrCodeWithLibrary(
    data,
    errorCorrectLevel,
    size,
    foregroundColor,
    backgroundColor
  ) {
    this.elements.qrPreview.innerHTML = "";

    try {
      if (typeof QRCore === "undefined") {
        throw new Error("QRCore library not loaded");
      }

      const qr = new QRCore({
        text: data,
        size: size,
        color: foregroundColor,
        bgColor: backgroundColor,
        errorCorrection: errorCorrectLevel === "A" ? "M" : errorCorrectLevel, // handle "Automatic"
      });

      const svgMarkup = qr.toSVG();
      const qrContainer = document.createElement("div");
      qrContainer.id = "qr-code-container";
      qrContainer.innerHTML = svgMarkup;

      // Style container based on design sliders
      const borderRadius = parseInt(this.elements.containerRadius.value);
      const padding = parseInt(this.elements.containerPadding.value);

      qrContainer.style.cssText = `
        display: inline-block;
        background-color: ${backgroundColor};
        padding: ${padding}px;
        border-radius: ${borderRadius}px;
        overflow: hidden;
      `;

      this.elements.qrPreview.appendChild(qrContainer);

      // Enable downloads
      this._enableDownloads(qr);

      this.qrGenerated = true;
      this.currentQrData = data;
      this.elements.downloadOptions.classList.remove("hidden");
    } catch (error) {
      this._createErrorMessage(error.message);
      console.error("QR code generation error:", error);
    }
  },

  // Enable SVG/PNG download buttons
  _enableDownloads(qr) {
    const svgBtn = document.getElementbyId("download-svg");
    const pngBtn = document.getElementbyId("download-png");

    // SVG Download
    svgBtn.onclick = () => {
      const svgData = qr.toSVG();
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "qrcode.svg";
      link.click();
      URL.revokeObjectURL(link.href);
    };

    // PNG Download
    pngBtn.onclick = async () => {
      const dataUrl = await qr.toDataURL();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "qrcode.png";
      link.click();
    };
  },

  // Create error message element
  _createErrorMessage(message) {
    this.elements.qrPreview.innerHTML = "";
    const fragment = document.createDocumentFragment();
    const errorMessageDiv = document.createElement("div");
    errorMessageDiv.className = "qr-message";

    const iconElement = document.createElement("i");
    iconElement.setAttribute("data-lucide", "triangle-alert");

    const textElement = document.createElement("p");
    textElement.textContent = "Error generating QR code: " + message;

    errorMessageDiv.appendChild(iconElement);
    errorMessageDiv.appendChild(textElement);
    fragment.appendChild(errorMessageDiv);

    this.elements.qrPreview.appendChild(fragment);
    this.elements.downloadOptions.classList.add("hidden");

    if (
      typeof lucide !== "undefined" &&
      typeof lucide.createIcons === "function"
    ) {
      lucide.createIcons();
    }
  },

  // Reset QR code view
  reset() {
    this.currentQrData = "";
    this.qrGenerated = false;
    this.elements.qrPreview.innerHTML = "";

    const fragment = document.createDocumentFragment();
    const messageDiv = document.createElement("div");
    messageDiv.className = "qr-message";

    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "qr-code");

    const text = document.createElement("p");
    text.textContent = "Your QR code will appear here";

    messageDiv.appendChild(icon);
    messageDiv.appendChild(text);
    fragment.appendChild(messageDiv);

    this.elements.qrPreview.appendChild(fragment);

    if (
      typeof lucide !== "undefined" &&
      typeof lucide.createIcons === "function"
    ) {
      lucide.createIcons();
    }

    this.elements.downloadOptions.classList.add("hidden");
  },
};

export default QRGenerator;
