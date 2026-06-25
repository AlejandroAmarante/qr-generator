// Download Manager with High-Resolution Scaling
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
    this.elements.downloadSvgBtn.addEventListener("click", () =>
      this.downloadSvg()
    );
    // Download as PNG
    this.elements.downloadPngBtn.addEventListener("click", () =>
      this.downloadPng()
    );
  },
  // Download as SVG
  downloadSvg() {
    const qrSvg = document.querySelector("#qr-code-container svg");
    if (!qrSvg) return;
    const svgClone = qrSvg.cloneNode(true);
    // Only apply crispEdges to square elements without border radius
    svgClone.querySelectorAll("rect").forEach((rect) => {
      const hasBorderRadius =
        rect.getAttribute("rx") > 0 || rect.getAttribute("ry") > 0;
      if (!hasBorderRadius) {
        rect.setAttribute("shape-rendering", "crispEdges");
      }
    });
    // Create a blob and download link
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svgClone);
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
  // Download as PNG with high resolution scaling
  downloadPng() {
    // First check if there's an existing canvas (from canvas rendering)
    const existingCanvas = document.querySelector("#qr-code-container canvas");
    if (existingCanvas) {
      // Use the existing canvas directly - it already has all styling applied
      this._downloadFromCanvas(existingCanvas);
    } else {
      // Fall back to SVG conversion for SVG/table rendering
      this._downloadFromSvg();
    }
  },
  // Download from existing canvas
  _downloadFromCanvas(canvas) {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
  // Convert SVG to PNG with high-resolution scaling
  _downloadFromSvg() {
    const qrSvg = document.querySelector("#qr-code-container svg");
    if (!qrSvg) return;

    const originalWidth = parseInt(qrSvg.getAttribute("width")) || 300;
    const originalHeight = parseInt(qrSvg.getAttribute("height")) || 300;

    // Higher scale factor to eliminate artifacts
    const scaleFactor = 20;
    const scaledWidth = originalWidth * scaleFactor;
    const scaledHeight = originalHeight * scaleFactor;

    // Create a scaled version of the SVG
    const svgClone = qrSvg.cloneNode(true);
    svgClone.setAttribute("width", scaledWidth);
    svgClone.setAttribute("height", scaledHeight);

    // Ensure integer pixel alignment
    const viewBox = svgClone.getAttribute("viewBox");
    if (viewBox) {
      const [x, y, w, h] = viewBox.split(" ").map(Number);
      svgClone.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
    } else {
      svgClone.setAttribute(
        "viewBox",
        `0 0 ${originalWidth} ${originalHeight}`
      );
    }

    // Fix positioning and add slight overlap to eliminate seams
    svgClone.querySelectorAll("rect").forEach((rect) => {
      const hasBorderRadius =
        rect.getAttribute("rx") > 0 || rect.getAttribute("ry") > 0;

      if (!hasBorderRadius) {
        rect.setAttribute("shape-rendering", "crispEdges");

        // Add tiny overlap to prevent seams
        const x = parseFloat(rect.getAttribute("x") || 0);
        const y = parseFloat(rect.getAttribute("y") || 0);
        const width = parseFloat(rect.getAttribute("width") || 0);
        const height = parseFloat(rect.getAttribute("height") || 0);

        // Expand by 0.1 pixel to create overlap
        rect.setAttribute("x", (x - 0.05).toString());
        rect.setAttribute("y", (y - 0.05).toString());
        rect.setAttribute("width", (width + 0.1).toString());
        rect.setAttribute("height", (height + 0.1).toString());
      }
    });

    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svgClone);
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      svgData
    )}`;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      // Ensure pixel-perfect alignment
      ctx.translate(0.5, 0.5);
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      // Create final canvas at original size
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = originalWidth;
      finalCanvas.height = originalHeight;

      const finalCtx = finalCanvas.getContext("2d");
      finalCtx.imageSmoothingEnabled = false;
      finalCtx.drawImage(
        canvas,
        0,
        0,
        scaledWidth,
        scaledHeight,
        0,
        0,
        originalWidth,
        originalHeight
      );

      finalCanvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "qrcode.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.onerror = () => {
      console.error("Failed to load SVG image.");
      this._downloadPngFallback();
    };
    img.src = svgDataUrl;
  },
  // Fallback PNG download method
  _downloadPngFallback() {
    console.log("Using fallback PNG download method");
    // You can implement an alternative method here if needed
  },
};

export default DownloadManager;
