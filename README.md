# Free Medium - Extension

A browser extension for enhancing Medium.com experience with additional features.

## Features

- **Premium Content Access**: Unlock premium articles and content
- **Enhanced Reading Experience**: Improved reading interface and customization
- **Security Features**: Enhanced privacy and security protections
- **Database Integration**: Local storage for user preferences and data
- **Payment Integration**: Stripe integration for premium features

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/free-medium-extension.git
   cd free-medium-extension
   ```

2. Load the extension in your browser:
   - **Chrome**: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the extension folder
   - **Firefox**: Go to `about:debugging`, click "This Firefox", then "Load Temporary Add-on" and select any file in the extension folder

## Files

- `manifest.json` - Extension configuration and permissions
- `content.js` - Content script for Medium.com pages
- `background.js` - Background script for extension logic
- `server.js` - Server-side functionality
- `database.js` - Database management
- `security.js` - Security and privacy features
- `stripe.js` - Payment processing
- `premium.html` - Premium features interface
- `recovery.js` - Account recovery functionality

## Development

### Requirements

- Node.js (for server-side functionality)
- Modern web browser (Chrome, Firefox, or Edge)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This extension is for educational purposes only. Please respect Medium.com's terms of service and copyright policies.