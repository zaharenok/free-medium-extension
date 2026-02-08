# Privacy Policy

**Last Updated:** February 2026
**Extension:** Medium to Freedium Redirect
**Version:** 1.2

## Data Collection

This extension does **NOT** collect or transmit any personal data.

### What We Store (Locally Only)

All data is stored locally on your device using Chrome's storage API:

- **Daily article redirect count** - Tracks how many articles you've redirected today (shown in the banner)
- **Premium subscription status** - Stores premium expiration date if you have premium

This data never leaves your device.

### Google Analytics (Anonymous Only)

We use Google Analytics to understand how the extension is being used:

- **Extension install events** - Count of installations
- **Article redirect events** - Aggregate count of redirects (no article URLs stored)
- **Feature usage** - Banner displays, "Learn More" button clicks

**No personally identifiable information** is collected. We cannot see which articles you read or any personal information.

## Permissions Explained

### Storage
Saves your preferences locally on your device.

### Tabs
Allows the extension to redirect Medium articles to Freedium.

### WebNavigation
Detects when you visit a Medium article so we can show the countdown banner.

### Host Permissions (`<all_urls>`)
The content script is injected on all websites to intercept clicks on Medium links wherever they appear (Twitter, Reddit, blogs, newsletters).

**Important:** The extension does NOT read or transmit page content. It only:
- Checks if a URL matches Medium domain patterns
- Detects Medium-specific DOM elements to identify paywalled articles
- Intercepts clicks on Medium links

## Data Sharing

We do **NOT** sell, rent, or share your data with third parties.

## Data Retention

- **Local storage data** remains on your device until you uninstall the extension
- **Google Analytics data** follows Google's standard retention policies (26 months by default)

## Your Rights

- **Access** - You can view local storage in Chrome DevTools (Application → Storage)
- **Deletion** - Uninstalling the extension removes all locally stored data
- **Opt-out** - You can disable Google Analytics by modifying the extension source code

## Children's Privacy

This extension is not directed to children under 13. We do not knowingly collect data from children.

## Changes to This Policy

We may update this policy as the extension evolves. Changes will be posted here.

## Contact

For questions about this privacy policy, please visit:
https://github.com/zaharenok/free-medium-extension/issues
