# QR Code Generator

A lightweight, customizable QR code generator built with vanilla JavaScript.

## Overview

This project provides a simple yet powerful QR code generator that supports multiple data formats, custom styling, and export options. It's built using modern JavaScript without any frameworks or unnecessary dependencies.

## Features

- **Multiple QR code types**:
  - URL
  - Plain text
  - Email with subject and body
  - Phone number
  - SMS with pre-filled message
  - WiFi network credentials
  - vCard contact information

- **Customization options**:
  - Size selection
  - Custom foreground and background colors
  - Adjustable container border radius
  - Customizable padding

- **Export formats**:
  - SVG (scalable vector graphics)
  - PNG (raster image)

## Technical Implementation

The codebase is organized into modular components:

- `dom-elements.js`: Centralizes DOM element references  
- `qr-data-handler.js`: Handles QR code data formatting for different types  
- `qr-style-manager.js`: Manages styling parameters  
- `qr-generator.js`: Core QR code generation logic  
- `download-manager.js`: Handles export functionality  
- `type-selector.js`: Manages QR code type selection and form display  
- `main.js`: Initializes and connects all components  

## Dependencies

- [QRCode.js](https://github.com/davidshimjs/qrcodejs) - QR code generation library
- [Lucide Icons](https://lucide.dev/) - SVG icon library

## Browser Compatibility

Works with all modern browsers that support:
- ES6 modules
- Canvas API
- SVG

## Setup

1. Clone the repository
2. Open `index.html` in a browser or set up a local web server

No build steps or compilation required.

## Usage

1. Select the QR code type using the buttons at the top
2. Fill in the required information in the form fields
3. Customize the appearance using the style options
4. Download the generated QR code in your preferred format

## License

[MIT License](LICENSE)