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

      // Update QR code when type changes
      setTimeout(updateQRCode, 10);
    });
  });

  // Add event listeners to all input fields to trigger updates
  function addUpdateListeners() {
    qrGenerated = false;
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
        // Force update for visual changes
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

    // Create a download link
    const a = document.createElement("a");
    a.href = qrImage.toDataURL("image/png");
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Helper function to convert canvas to SVG
  function generateSVGFromCanvas(canvas, size) {
    const ctx = canvas.getContext("2d");
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const backgroundColor = qrBgcolor.value;
    const foregroundColor = qrColor.value;

    // Calculate the module size (QR code cell size)
    const moduleSize = canvas.width / Math.sqrt(pixelData.data.length / 4);

    // Create SVG content
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${canvas.width} ${canvas.height}">`;

    // Add background
    svgContent += `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;

    // Add QR code modules
    for (let y = 0; y < canvas.height; y += moduleSize) {
      for (let x = 0; x < canvas.width; x += moduleSize) {
        // Check if this module is black
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = pixelData.data[pixelIndex];
        const g = pixelData.data[pixelIndex + 1];
        const b = pixelData.data[pixelIndex + 2];

        // If the pixel is dark (QR code module)
        if (r + g + b < 384) {
          // Simple threshold for black/white detection
          svgContent += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${foregroundColor}"/>`;
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
