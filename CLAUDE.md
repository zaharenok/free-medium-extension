# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser extension that automatically redirects Medium articles to Freedium (freedium-mirror.cfd).

## Architecture

### Extension Structure

- **manifest.json**: Manifest V3 configuration
  - Content script injected on all URLs
  - Permissions: `storage`, `tabs`
  - Host permissions: `<all_urls>`

- **content.js**: Content script that runs on every page
  - Detects Medium articles via DOM signatures (meta tags, class names)
  - Shows countdown banner before redirect
  - Intercepts clicks on Medium links
  - Observes DOM for dynamically added links

- **background.js**: Service worker
  - Handles navigation events
  - Tracks daily article count
  - Checks premium status
  - Manages storage

### Data Storage (chrome.storage.local)

- `articleStats`: Daily statistics with count and article URLs
- `premiumUntil`: ISO date string for premium expiration

### Medium Domain Detection

Intercepts these domains:
- medium.com
- generativeai.pub
- towardsdatascience.com
- bettermarketing.pub
- bootcamp.uxdesign.cc
- plainenglish.io

## Development Timeline

### Recent Commits (Last 10)
- **d81adfd** (2025-02-08): Initial commit: Add browser extension files and comprehensive README

### Tags
- **base** - Base working version (initial commit)

## Development

### Loading the Extension

**Chrome/Edge:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension directory

**Firefox:**
1. Go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in the extension folder

### Testing Changes

1. Edit source files
2. Reload extension in `chrome://extensions/`
3. Visit a Medium article to test

### Return to Base Version

```bash
git checkout base
```

## Files

- `manifest.json` - Extension manifest (Manifest V3)
- `content.js` - Content script for banner display and link interception
- `background.js` - Service worker for navigation handling and storage
- `README.md` - Project documentation

## License

MIT License

## Disclaimer

This extension is for educational purposes only. Please respect Medium.com's terms of service and copyright policies.
