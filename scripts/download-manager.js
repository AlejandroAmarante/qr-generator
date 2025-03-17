// Download Manager
const DownloadManager = {
  // Initialize with required elements
  init(elements) {
    this.elements = elements;
    this._addDownloadListeners();
    return this;
  },

  // Add event listeners for download buttons
  _addDownloadListeners() {
    // Download as SVG
    this.elements.downloadSvgBtn.addEventListener("click", () => this.downloadSvg());
    
    // Download as PNG
    this.elements.downloadPngBtn.addEventListener("click", () => this.downloadPng());
  },

  // Download as SVG
  downloadSvg() {
    const qrImage = document.querySelector("#qr-code-container canvas");
    if (!qrImage) return;

    // Create SVG data
    const size = parseInt(this.elements.qrSize.value);
    const svgData = this.generateSVGFromCanvas(qrImage, size);

    // Create a blob and download link
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Download as PNG
  downloadPng() {
    const qrImage = document.querySelector("#qr-code-container canvas");
    if (!qrImage) return;

    // Create a temporary canvas to include padding and border radius
    const tempCanvas = document.createElement("canvas");
    const padding = parseInt(this.elements.containerPadding.value);
    const totalSize = qrImage.width + padding * 2;

    tempCanvas.width = totalSize;
    tempCanvas.height = totalSize;

    const ctx = tempCanvas.getContext("2d");

    // Draw rounded rectangle for background using the QR background color
    const radius = parseInt(this.elements.containerRadius.value);
    ctx.fillStyle = this.elements.qrBgcolor.value;
    this.roundedRect(ctx, 0, 0, totalSize, totalSize, radius);

    // Draw the QR code
    ctx.drawImage(qrImage, padding, padding);

    // Create a download link
    const a = document.createElement("a");
    a.href = tempCanvas.toDataURL("image/png");
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // Helper function for drawing rounded rectangles
  roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  },

  // Helper function to convert canvas to SVG
  generateSVGFromCanvas(canvas, size) {
    const ctx = canvas.getContext("2d");
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const backgroundColor = this.elements.qrBgcolor.value;
    const foregroundColor = this.elements.qrColor.value;
    const containerBgColor = backgroundColor;
    const borderRadius = parseInt(this.elements.containerRadius.value);
    const padding = parseInt(this.elements.containerPadding.value);

    // Calculate the module size (QR code cell size)
    const moduleSize = canvas.width / Math.sqrt(pixelData.data.length / 4);

    // Calculate adjusted size with padding
    const totalSize = size + padding * 2;

    // Create SVG content with container
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">`;

    // Add container with border radius
    svgContent += `<rect width="100%" height="100%" fill="${containerBgColor}" rx="${borderRadius}" ry="${borderRadius}"/>`;

    // Add QR background with padding offset
    svgContent += `<rect x="${padding}" y="${padding}" width="${size}" height="${size}" fill="${backgroundColor}"/>`;

    // Add QR code modules with padding offset
    for (let y = 0; y < canvas.height; y += moduleSize) {
      for (let x = 0; x < canvas.width; x += moduleSize) {
        // Check if this module is black
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = pixelData.data[pixelIndex];
        const g = pixelData.data[pixelIndex + 1];
        const b = pixelData.data[pixelIndex + 2];

        // If the pixel is dark (QR code module)
        if (r + g + b < 384) {
          // Scale the coordinates to the target size and add padding
          const scaledX = (x / canvas.width) * size + padding;
          const scaledY = (y / canvas.height) * size + padding;
          const scaledSize = (moduleSize / canvas.width) * size;

          svgContent += `<rect x="${scaledX}" y="${scaledY}" width="${scaledSize}" height="${scaledSize}" fill="${foregroundColor}"/>`;
        }
      }
    }

    svgContent += "</svg>";
    return svgContent;
  }
};

export default DownloadManager;
