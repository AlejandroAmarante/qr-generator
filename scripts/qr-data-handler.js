// QR Data Handler
const QRDataHandler = {
  // Initialize the handler
  init() {
    this.currentType = "url";
    return this;
  },

  // Build QR data based on form inputs and selected type
  buildQRData(type) {
    let data = "";

    switch (type) {
      case "url":
        const url = document.getElementById("url-input").value.trim();
        if (!url) return "";
        data = url;
        break;

      case "text":
        const text = document.getElementById("text-input").value.trim();
        if (!text) return "";
        data = text;
        break;

      case "email":
        const email = document.getElementById("email-address").value.trim();
        const subject = document.getElementById("email-subject").value.trim();
        const body = document.getElementById("email-body").value.trim();

        if (!email) return "";

        data = `mailto:${email}`;
        if (subject) data += `?subject=${encodeURIComponent(subject)}`;
        if (body)
          data += `${subject ? "&" : "?"}body=${encodeURIComponent(body)}`;
        break;

      case "phone":
        const phone = document.getElementById("phone-input").value.trim();
        if (!phone) return "";
        data = `tel:${phone}`;
        break;

      case "sms":
        const smsNumber = document.getElementById("sms-number").value.trim();
        const smsMessage = document.getElementById("sms-message").value.trim();

        if (!smsNumber) return "";

        data = `smsto:${smsNumber}`;
        if (smsMessage) data += `:${encodeURIComponent(smsMessage)}`;
        break;

      case "wifi":
        const ssid = document.getElementById("wifi-ssid").value.trim();
        const password = document.getElementById("wifi-password").value;
        const encryption = document.getElementById("wifi-encryption").value;
        const hidden = document.getElementById("wifi-hidden").checked;

        if (!ssid) return "";

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

        if (!name || !vcardPhone || !vcardEmail) return "";

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

    return data;
  },

  // Set active QR type
  setType(type) {
    this.currentType = type;
  },

  // Get current QR type
  getType() {
    return this.currentType;
  }
};

export default QRDataHandler;
