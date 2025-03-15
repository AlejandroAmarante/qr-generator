document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const typeButtons = document.querySelectorAll(".type-btn");
  const qrPreview = document.getElementById("qr-preview");
  const downloadOptions = document.getElementById("download-options");
  const downloadSvgBtn = document.getElementById("download-svg");
  const downloadPngBtn = document.getElementById("download-png");
  const qrSize = document.getElementById("qr-size");
  const qrColor = document.getElementById("qr-color");
  const qrBgcolor = document.getElementById("qr-bgcolor");
  const containerColor = document.getElementById("container-color");
  const containerRadius = document.getElementById("container-radius");
  const containerPadding = document.getElementById("container-padding");
  const radiusValue = document.getElementById("radius-value");
  const paddingValue = document.getElementById("padding-value");

  // QR Code Type form fields
  const formFields = {
    url: document.getElementById("url-fields"),
    text: document.getElementById("text-fields"),
    email: document.getElementById("email-fields"),
    phone: document.getElementById("phone-fields"),
    sms: document.getElementById("sms-fields"),
    wifi: document.getElementById("wifi-fields"),
    vcard: document.getElementById("vcard-fields"),
  };

  // Current selected QR type
  let currentType = "url";

  // Tracking current QR code data
  let currentQrData = "";
  let debounceTimer;
  // Track if we've already rendered a QR code
  let qrGenerated = false;

  // Handle QR type button clicks
  typeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const selectedType = this.getAttribute("data-type");

      // Update active button state
      typeButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      // Hide all fields first
      Object.values(formFields).forEach((field) => {
        field.classList.add("hidden");
      });

      // Show only the selected type's fields
      formFields[selectedType].classList.remove("hidden");

      // Update current type
      currentType = selectedType;

      // Reset currentQrData when type changes to force regeneration
      currentQrData = "";
      qrPreview.innerHTML = "<p>Your QR code will appear here</p>";
      qrGenerated = false;
      downloadOptions.classList.add("hidden");

      // Update QR code when type changes
      setTimeout(updateQRCode, 10);
    });
  });

  // Update container style function
  function updateContainerStyle() {
    const qrContainer = document.getElementById("qr-code-container");
    if (qrContainer) {
      qrContainer.style.backgroundColor = qrBgcolor.value; // Use the QR background color
      qrContainer.style.borderRadius = containerRadius.value + "px";
      qrContainer.style.padding = containerPadding.value + "px";
    }
  }

  // Add event listeners to all input fields to trigger updates
  function addUpdateListeners() {
    qrGenerated = false;

    // Update display values for range inputs initially
    if (radiusValue) radiusValue.textContent = containerRadius.value + "px";
    if (paddingValue) paddingValue.textContent = containerPadding.value + "px";

    // Add listeners to the styling controls
    qrColor.addEventListener("input", function () {
      if (qrGenerated) {
        // Force update for visual changes
        currentQrData = "";
        updateQRCode();
      }
    });

    qrBgcolor.addEventListener("input", function () {
      if (qrGenerated) {
        // Update the container style immediately when background color changes
        updateContainerStyle();
        // Also force QR code update if needed
        currentQrData = "";
        updateQRCode();
      }
    });

    qrSize.addEventListener("input", function () {
      if (qrGenerated) {
        // Force update for visual changes
        currentQrData = "";
        updateQRCode();
      }
    });

    containerRadius.addEventListener("input", function () {
      radiusValue.textContent = this.value + "px";
      if (qrGenerated) {
        updateContainerStyle();
      }
    });

    containerPadding.addEventListener("input", function () {
      paddingValue.textContent = this.value + "px";
      if (qrGenerated) {
        updateContainerStyle();
      }
    });

    // Add listeners to all form input fields
    const allFormInputs = document.querySelectorAll(
      ".qr-type-fields input, .qr-type-fields select, .qr-type-fields textarea"
    );
    allFormInputs.forEach((input) => {
      input.addEventListener("input", debounceUpdate);
      input.addEventListener("change", debounceUpdate);
    });
  }

  // Debounce function to prevent too many updates
  function debounceUpdate() {
    clearTimeout(debounceTimer);
    // Reset the current data to force an update
    currentQrData = "";
    debounceTimer = setTimeout(updateQRCode, 300); // Wait 300ms after last change
  }

  // Update QR code function
  function updateQRCode() {
    const type = currentType;
    const size = parseInt(qrSize.value);
    const color = qrColor.value;
    const bgcolor = qrBgcolor.value;

    let data = "";

    // Build data based on QR type
    switch (type) {
      case "url":
        const url = document.getElementById("url-input").value.trim();
        if (!url) {
          return; // Don't update if empty
        }
        data = url;
        break;

      case "text":
        const text = document.getElementById("text-input").value.trim();
        if (!text) {
          return; // Don't update if empty
        }
        data = text;
        break;

      case "email":
        const email = document.getElementById("email-address").value.trim();
        const subject = document.getElementById("email-subject").value.trim();
        const body = document.getElementById("email-body").value.trim();

        if (!email) {
          return; // Don't update if empty
        }

        data = `mailto:${email}`;
        if (subject) data += `?subject=${encodeURIComponent(subject)}`;
        if (body)
          data += `${subject ? "&" : "?"}body=${encodeURIComponent(body)}`;
        break;

      case "phone":
        const phone = document.getElementById("phone-input").value.trim();
        if (!phone) {
          return; // Don't update if empty
        }
        data = `tel:${phone}`;
        break;

      case "sms":
        const smsNumber = document.getElementById("sms-number").value.trim();
        const smsMessage = document.getElementById("sms-message").value.trim();

        if (!smsNumber) {
          return; // Don't update if empty
        }

        data = `smsto:${smsNumber}`;
        if (smsMessage) data += `:${encodeURIComponent(smsMessage)}`;
        break;

      case "wifi":
        const ssid = document.getElementById("wifi-ssid").value.trim();
        const password = document.getElementById("wifi-password").value;
        const encryption = document.getElementById("wifi-encryption").value;
        const hidden = document.getElementById("wifi-hidden").checked;

        if (!ssid) {
          return; // Don't update if empty
        }

        data = `WIFI:S:${ssid};T:${encryption};`;
        if (password && encryption !== "nopass") data += `P:${password};`;
        if (hidden) data += "H:true;";
        data += ";";
        break;

      case "vcard":
        const name = document.getElementById("vcard-name").value.trim();
        const company = document.getElementById("vcard-company").value.trim();
        const title = document.getElementById("vcard-title").value.trim();
        const vcardPhone = document.getElementById("vcard-phone").value.trim();
        const vcardEmail = document.getElementById("vcard-email").value.trim();
        const website = document.getElementById("vcard-website").value.trim();
        const address = document.getElementById("vcard-address").value.trim();

        if (!name || !vcardPhone || !vcardEmail) {
          return; // Don't update if required fields are empty
        }

        data = "BEGIN:VCARD\nVERSION:3.0\n";
        data += `FN:${name}\n`;
        if (company) data += `ORG:${company}\n`;
        if (title) data += `TITLE:${title}\n`;
        if (vcardPhone) data += `TEL:${vcardPhone}\n`;
        if (vcardEmail) data += `EMAIL:${vcardEmail}\n`;
        if (website) data += `URL:${website}\n`;
        if (address) data += `ADR:;;${address};;;\n`;
        data += "END:VCARD";
        break;
    }

    // Don't regenerate if empty
    if (data === "") {
      return;
    }

    // Generate QR code using QRCode.js
    generateQrCodeWithLibrary(data, size, color, bgcolor);
  }

  // Function to generate QR code using QRCode.js library
  function generateQrCodeWithLibrary(
    data,
    size,
    foregroundColor,
    backgroundColor
  ) {
    // Clear the preview area
    qrPreview.innerHTML = "";

    // Create a container for the QR code
    const qrContainer = document.createElement("div");
    qrContainer.id = "qr-code-container";
    qrPreview.appendChild(qrContainer);

    try {
      // Check if QRCode is available
      if (typeof QRCode === "undefined") {
        throw new Error("QRCode library not loaded");
      }

      // Set QR code options
      let options;

      // Different QRCode libraries have different API structures
      if (QRCode.CorrectLevel) {
        // Standard qrcode.js library
        options = {
          text: data,
          width: size,
          height: size,
          colorDark: foregroundColor,
          colorLight: backgroundColor,
          correctLevel: QRCode.CorrectLevel.H,
        };
      } else {
        // Some libraries use numeric values
        options = {
          text: data,
          width: size,
          height: size,
          colorDark: foregroundColor,
          colorLight: backgroundColor,
          correctLevel: 2, // H level is often 2
        };
      }

      // Generate the QR code
      new QRCode(qrContainer, options);

      // Apply container styling after a short delay
      setTimeout(() => {
        updateContainerStyle();
      }, 50);

      // Mark that we've generated a QR code
      qrGenerated = true;

      // Store the current QR data for comparison
      currentQrData = data;

      // Show download options
      downloadOptions.classList.remove("hidden");
    } catch (error) {
      qrPreview.innerHTML =
        "<p>Error generating QR code: " + error.message + "</p>";
      downloadOptions.classList.add("hidden");
      console.error("QR code generation error:", error);
    }
  }

  // Download as SVG
  downloadSvgBtn.addEventListener("click", function () {
    const qrImage = document.querySelector("#qr-code-container canvas");
    if (!qrImage) return;

    // Create SVG data
    const size = parseInt(qrSize.value);
    const svgData = generateSVGFromCanvas(qrImage, size);

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
  });

  // Download as PNG
  downloadPngBtn.addEventListener("click", function () {
    const qrImage = document.querySelector("#qr-code-container canvas");
    if (!qrImage) return;

    // Create a temporary canvas to include padding and border radius
    const tempCanvas = document.createElement("canvas");
    const padding = parseInt(containerPadding.value);
    const totalSize = qrImage.width + padding * 2;

    tempCanvas.width = totalSize;
    tempCanvas.height = totalSize;

    const ctx = tempCanvas.getContext("2d");

    // Draw rounded rectangle for background using the QR background color
    const radius = parseInt(containerRadius.value);
    ctx.fillStyle = qrBgcolor.value; // Use QR background color here
    roundedRect(ctx, 0, 0, totalSize, totalSize, radius);

    // Draw the QR code
    ctx.drawImage(qrImage, padding, padding);

    // Create a download link
    const a = document.createElement("a");
    a.href = tempCanvas.toDataURL("image/png");
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Helper function for drawing rounded rectangles
    function roundedRect(ctx, x, y, width, height, radius) {
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
    }
  });

  // Helper function to convert canvas to SVG
  function generateSVGFromCanvas(canvas, size) {
    const ctx = canvas.getContext("2d");
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const backgroundColor = qrBgcolor.value;
    const foregroundColor = qrColor.value;
    // Use backgroundColor for containerBgColor
    const containerBgColor = backgroundColor;
    const borderRadius = parseInt(containerRadius.value);
    const padding = parseInt(containerPadding.value);

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

  // Set up all input listeners
  addUpdateListeners();

  // Initial load - show the first QR code if fields are already filled
  setTimeout(function () {
    // Force update on initial load
    currentQrData = "";
    updateQRCode();
  }, 500);
});
