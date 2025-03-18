// DOM Elements module
const DOMElements = {
  // Initialize and store DOM element references
  init() {
    this.typeButtons = document.querySelectorAll(".type-btn");
    this.qrPreview = document.getElementById("qr-preview");
    this.qrMessage = document.getElementById("qr-message");
    this.downloadOptions = document.getElementById("download-options");
    this.downloadSvgBtn = document.getElementById("download-svg");
    this.downloadPngBtn = document.getElementById("download-png");
    this.qrSize = document.getElementById("qr-size");
    this.qrColor = document.getElementById("qr-color");
    this.qrBgcolor = document.getElementById("qr-bgcolor");
    this.containerRadius = document.getElementById("container-radius");
    this.containerPadding = document.getElementById("container-padding");
    this.radiusValue = document.getElementById("radius-value");
    this.paddingValue = document.getElementById("padding-value");

    // QR Code Type form fields
    this.formFields = {
      url: document.getElementById("url-fields"),
      text: document.getElementById("text-fields"),
      email: document.getElementById("email-fields"),
      phone: document.getElementById("phone-fields"),
      sms: document.getElementById("sms-fields"),
      wifi: document.getElementById("wifi-fields"),
      vcard: document.getElementById("vcard-fields"),
    };

    return this;
  },
};

export default DOMElements;
