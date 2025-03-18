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
    const allFormInputs = document.querySelectorAll(
      ".qr-type-fields input, .qr-type-fields select, .qr-type-fields textarea"
    );

    allFormInputs.forEach((input) => {
      input.addEventListener("input", () => this._debounceUpdate());
      input.addEventListener("change", () => this._debounceUpdate());
    });
  },

  // Debounce function to prevent too many updates
  _debounceUpdate() {
    clearTimeout(this.debounceTimer);
    // Reset the current data to force an update
    this.currentQrData = "";
    this.debounceTimer = setTimeout(() => this.updateQRCode(), 300);
  },

  // Update QR code function
  updateQRCode() {
    const type = this.dataHandler.getType();
    const size = parseInt(this.elements.qrSize.value);
    const color = this.elements.qrColor.value;
    const bgcolor = this.elements.qrBgcolor.value;

    // Build data based on QR type
    const data = this.dataHandler.buildQRData(type);

    // Don't regenerate if empty
    if (data === "") {
      this.reset();
      return;
    }

    // Skip regeneration if the data hasn't changed
    if (data === this.currentQrData && this.qrGenerated) {
      return;
    }

    // Generate QR code using QRCode.js
    this.generateQrCodeWithLibrary(data, size, color, bgcolor);
  },

  // Function to generate QR code using QRCode.js library
  generateQrCodeWithLibrary(data, size, foregroundColor, backgroundColor) {
    // Clear the preview area
    this.elements.qrPreview.innerHTML = "";

    // Create a container for the QR code
    const qrContainer = document.createElement("div");
    qrContainer.id = "qr-code-container";
    this.elements.qrPreview.appendChild(qrContainer);

    try {
      // Check if QRCode is available
      if (typeof QRCode === "undefined") {
        throw new Error("QRCode library not loaded");
      }

      // Set QR code options
      let options = {
        text: data,
        width: size,
        height: size,
        colorDark: foregroundColor,
        colorLight: backgroundColor,
        correctLevel: QRCode.CorrectLevel.H,
      };

      // Generate the QR code
      new QRCode(qrContainer, options);

      // Apply container styling after a short delay
      setTimeout(() => {
        this.styleManager.updateContainerStyle();
      }, 0);

      // Mark that we've generated a QR code
      this.qrGenerated = true;

      // Store the current QR data for comparison
      this.currentQrData = data;

      // Show download options
      this.elements.downloadOptions.classList.remove("hidden");
    } catch (error) {
      this.elements.qrPreview.innerHTML =
        "<p>Error generating QR code: " + error.message + "</p>";
      this.elements.downloadOptions.classList.add("hidden");
      console.error("QR code generation error:", error);
    }
  },

  // Reset QR code view
  reset() {
    this.currentQrData = "";
    this.qrGenerated = false;

    // Clear the preview
    this.elements.qrPreview.innerHTML = "";

    // Create message container
    const messageDiv = document.createElement("div");
    messageDiv.id = "qr-message";

    // Add icon
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "qr-code");

    // Add text
    const text = document.createElement("p");
    text.textContent = "Your QR code will appear here";

    // Build the structure
    messageDiv.appendChild(icon);
    messageDiv.appendChild(text);
    this.elements.qrPreview.appendChild(messageDiv);

    // Initialize the icon
    lucide.createIcons();

    this.elements.downloadOptions.classList.add("hidden");
  },
};

export default QRGenerator;
