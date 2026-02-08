# Chrome Web Store Privacy - Justification Text

## Purpose Description (Единственное назначение)

```
Automatically redirects paywalled Medium articles to Freedium,
a free mirror service. The extension detects when users visit
Medium paywall pages and shows a 10-second countdown before
redirecting to the free version on Freedium.
```

---

## Storage Permission Justification

```
Used to store user preferences and daily article count locally.
The extension tracks how many articles have been redirected each
day to display usage statistics to the user. All data is stored
locally on the user's device and is not transmitted to any server
except for anonymous Google Analytics events (aggregated counts only).
```

---

## Tabs Permission Justification

```
Required to detect when a user navigates to a Medium article and
to obtain the current tab's URL for redirection. The extension
needs to know the URL to determine if it's a Medium article that
should be redirected to Freedium. Also used to send messages to
content scripts to display the countdown banner.

The extension must handle ALL tabs, not just the active tab,
because users may open Medium links in background tabs.
```

---

## WebNavigation Permission Justification

```
Used to detect navigation events to Medium articles across all
tabs (including background tabs). This allows the extension to
automatically show the countdown banner when a user visits a
paywalled Medium article and redirect after 10 seconds.

This permission is necessary for the core functionality and
cannot be replaced with tabs.onUpdated because webNavigation
fires before page content renders, ensuring seamless redirection.
```

---

## Host Permissions Justification (`<all_urls>`)

```
The content script is injected on all websites to intercept clicks
on Medium links wherever they appear on the web. Users encounter
Medium links on many platforms: Twitter, Reddit, Hacker News,
blogs, newsletters, and social aggregators.

The extension must intercept these clicks globally to provide
seamless redirection without requiring user action on each link.

PRIVACY NOTE: The extension does NOT read or transmit page content
except for:
1. Checking if a URL matches Medium domain patterns (medium.com,
   towardsdatascience.com, bettermarketing.pub, etc.)
2. Detecting Medium-specific DOM elements to identify paywalled
   articles (meta tags, CSS selectors)

The content script includes early-exit optimization to minimize
processing on pages with no Medium-related content.

Google Analytics permission is used solely for anonymous usage
statistics (install counts, redirect counts) - no personal data
or article URLs are transmitted.
```

---

## Data Collected (Передача данных)

Select ONLY these options:
- ✅ **История веб-поиска** (Web browsing history) - *Only checks if URL is a Medium article*
- ✅ **Содержимое сайтов** (Website content) - *Only reads Medium article URLs*

All other options (personal info, financial data, etc.) - ❌ **NOT selected**

---

## Privacy Policy URL

After uploading to GitHub, use:
```
https://github.com/zaharenok/free-medium-extension/blob/main/PRIVACY.md
```

---

## Remote Code (Удаленный код)

Select: **"Нет, я не использую разрешение 'Удаленный код'"**

---

## Confirmations (Подтверждения)

All three boxes checked:
- ✅ Я не продаю и не передаю пользовательские данные
- ✅ Я не использую и не передаю пользовательские данные в целях, не связанных с работой
- ✅ Я не использую и не передаю пользовательские данные для определения платежеспособности

---

## Note on Delayed Review

The `<all_urls>` permission will trigger a detailed review, which
typically takes 1-2 additional days. This is expected for extensions
that modify browsing behavior globally.

The permission is legitimate because:
1. Core functionality requires global link interception
2. Clear user benefit (automatic paywall bypass)
3. Privacy-respecting implementation (minimal data collection)
4. Early-exit optimization demonstrates privacy-conscious design
