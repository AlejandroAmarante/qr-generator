/**
 * download.js — SVG and PNG download handling
 * Renamed from download-manager.js; logic is unchanged.
 */

const DownloadManager = {
  init(elements) {
    this.elements = elements;
    this.elements.downloadSvgBtn.addEventListener("click", () =>
      this.downloadSvg(),
    );
    this.elements.downloadPngBtn.addEventListener("click", () =>
      this.downloadPng(),
    );
    return this;
  },

  downloadSvg() {
    const qrSvg = document.querySelector("#qr-code-container svg");
    if (!qrSvg) return;

    const clone = qrSvg.cloneNode(true);
    clone.querySelectorAll("rect").forEach((rect) => {
      if (!(rect.getAttribute("rx") > 0 || rect.getAttribute("ry") > 0)) {
        rect.setAttribute("shape-rendering", "crispEdges");
      }
    });

    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    this._triggerDownload(URL.createObjectURL(blob), "qrcode.svg");
  },

  downloadPng() {
    const canvas = document.querySelector("#qr-code-container canvas");
    if (canvas) {
      this._downloadFromCanvas(canvas);
    } else {
      this._downloadFromSvg();
    }
  },

  _downloadFromCanvas(canvas) {
    this._triggerDownload(canvas.toDataURL("image/png"), "qrcode.png");
  },

  _downloadFromSvg() {
    const qrSvg = document.querySelector("#qr-code-container svg");
    if (!qrSvg) return;

    const originalWidth = parseInt(qrSvg.getAttribute("width")) || 300;
    const originalHeight = parseInt(qrSvg.getAttribute("height")) || 300;
    const scaleFactor = 20;
    const scaledWidth = originalWidth * scaleFactor;
    const scaledHeight = originalHeight * scaleFactor;

    const clone = qrSvg.cloneNode(true);
    clone.setAttribute("width", scaledWidth);
    clone.setAttribute("height", scaledHeight);

    if (!clone.getAttribute("viewBox")) {
      clone.setAttribute("viewBox", `0 0 ${originalWidth} ${originalHeight}`);
    }

    clone.querySelectorAll("rect").forEach((rect) => {
      if (!(rect.getAttribute("rx") > 0 || rect.getAttribute("ry") > 0)) {
        rect.setAttribute("shape-rendering", "crispEdges");
        const x = parseFloat(rect.getAttribute("x") || 0);
        const y = parseFloat(rect.getAttribute("y") || 0);
        const w = parseFloat(rect.getAttribute("width") || 0);
        const h = parseFloat(rect.getAttribute("height") || 0);
        rect.setAttribute("x", (x - 0.05).toString());
        rect.setAttribute("y", (y - 0.05).toString());
        rect.setAttribute("width", (w + 0.1).toString());
        rect.setAttribute("height", (h + 0.1).toString());
      }
    });

    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      new XMLSerializer().serializeToString(clone),
    )}`;

    const img = new Image();
    img.onload = () => {
      const hires = document.createElement("canvas");
      hires.width = scaledWidth;
      hires.height = scaledHeight;
      const hiresCtx = hires.getContext("2d");
      hiresCtx.imageSmoothingEnabled = false;
      hiresCtx.translate(0.5, 0.5);
      hiresCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      const final = document.createElement("canvas");
      final.width = originalWidth;
      final.height = originalHeight;
      const finalCtx = final.getContext("2d");
      finalCtx.imageSmoothingEnabled = false;
      finalCtx.drawImage(
        hires,
        0,
        0,
        scaledWidth,
        scaledHeight,
        0,
        0,
        originalWidth,
        originalHeight,
      );

      final.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        this._triggerDownload(url, "qrcode.png");
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.onerror = () => console.error("Failed to load SVG for PNG export.");
    img.src = svgDataUrl;
  },

  _triggerDownload(href, filename) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};

export default DownloadManager;
