// Main app module that orchestrates all components
import DOMElements from "./dom-elements.js";
import QRDataHandler from "./qr-data-handler.js";
import QRGenerator from "./qr-generator.js";
import QRStyleManager from "./qr-style-manager.js";
import DownloadManager from "./download-manager.js";
import TypeSelector from "./type-selector.js";

// Main application
const QRCodeApp = {
  // Initialize the application
  init() {
    // Wait for DOM to be fully loaded
    document.addEventListener("DOMContentLoaded", () => {
      // Initialize components
      const elements = DOMElements.init();
      const dataHandler = QRDataHandler.init();

      // Create modules with circular dependencies
      const qrGenerator = QRGenerator.init(elements, dataHandler, null);
      const styleManager = QRStyleManager.init(elements, qrGenerator);
      const downloadManager = DownloadManager.init(elements);
      const typeSelector = TypeSelector.init(
        elements,
        dataHandler,
        qrGenerator
      );

      // Resolve circular dependencies
      qrGenerator.styleManager = styleManager;

      // Initial load - show the first QR code if fields are already filled
      setTimeout(() => {
        qrGenerator.currentQrData = ""; // Force update on initial load
        qrGenerator.updateQRCode();
      }, 500);
    });
  },
};

// Initialize the QR Code application
QRCodeApp.init();
