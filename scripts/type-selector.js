// QR Code Type Selector
const TypeSelector = {
  // Initialize the type selector
  init(elements, dataHandler, qrGenerator) {
    this.elements = elements;
    this.dataHandler = dataHandler;
    this.qrGenerator = qrGenerator;

    this._addTypeButtonListeners();

    return this;
  },

  // Add event listeners to QR type buttons
  _addTypeButtonListeners() {
    this.elements.typeButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const selectedType = event.target
          .closest("button")
          ?.getAttribute("data-type");
        this.selectType(selectedType);
      });
    });
  },

  // Select a QR type
  selectType(selectedType) {
    // Update active button state
    this.elements.typeButtons.forEach((btn) => btn.classList.remove("active"));

    // Find and activate the button for the selected type
    const selectedButton = Array.from(this.elements.typeButtons).find(
      (btn) => btn.getAttribute("data-type") === selectedType
    );

    if (selectedButton) {
      selectedButton.classList.add("active");
    }

    // Hide all fields first
    Object.values(this.elements.formFields).forEach((field) => {
      field.classList.add("hidden");
    });

    // Show only the selected type's fields
    if (this.elements.formFields[selectedType]) {
      this.elements.formFields[selectedType].classList.remove("hidden");
    }

    // Update current type in data handler
    this.dataHandler.setType(selectedType);

    // Reset QR generator
    this.qrGenerator.reset();

    // Update QR code when type changes
    setTimeout(() => this.qrGenerator.updateQRCode(), 10);
  },
};

export default TypeSelector;
