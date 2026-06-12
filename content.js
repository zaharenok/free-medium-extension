(() => {
  'use strict';
  const LOG = (...args) => console.log('%c[Freedium Ext]', 'color:#1a8917;font-weight:bold', ...args);
  LOG('Content script loaded', window.location.href);
  const FREEDIUM_BASE = 'https://freedium-mirror.cfd';

  // Medium domains
  const MEDIUM_DOMAINS = [
    'medium.com',
    'towardsdatascience.com',
    'bettermarketing.pub',
    'generativeai.pub',
    'bootcamp.uxdesign.cc',
    'plainenglish.io',
    'blog.bitsrc.io',
    'codeburst.io',
    'itnext.io',
    'levelup.gitconnected.com',
    'javascript.plainenglish.io',
    'python.plainenglish.io',
    'blog.devgenius.io',
    'proandroiddev.com',
    'writingcooperative.com',
  ];

  function isMediumUrl(url) {
    try {
      const u = new URL(url);
      const result = MEDIUM_DOMAINS.some(d => u.hostname === d || u.hostname.endsWith('.' + d));
      LOG('isMediumUrl?', url, 'hostname:', u.hostname, '=>', result);
      return result;
    } catch(e) {
      LOG('isMediumUrl ERROR', e.message);
      return false;
    }
  }

  // Check if current page is a Medium article
  function isMediumArticlePage() {
    const url = window.location.href;
    if (!isMediumUrl(url)) { LOG('isMediumArticlePage: not a medium domain'); return false; }

    // Medium articles: /@user/slug (dots allowed in username like joe.njenga)
    // or /publication-name/article-slug (at least 2 path segments, not /p/ special)
    const path = window.location.pathname;
    LOG('isMediumArticlePage: path =', path);

    if (path.match(/^\/@[\w.-]+\/[\w-]+/)) { LOG('=> matched @user/slug'); return true; }
    if (path.match(/^\/p\//)) { LOG('=> matched /p/'); return true; }
    // Publication articles: /short-name/article-slug-here (2+ segments, not root or /@)
    const segments = path.split('/').filter(Boolean);
    LOG('segments:', segments);
    if (segments.length >= 2 && !segments[0].startsWith('@') && segments[0] !== 'p') { LOG('=> matched publication/slug'); return true; }

    // Fallback: check for Medium meta tags
    const meta = document.querySelector('meta[property="al:android:app_name"]');
    LOG('meta tag:', meta ? meta.content : 'NOT FOUND');
    if (meta && meta.content === 'Medium') { LOG('=> matched meta tag'); return true; }

    LOG('=> NOT a medium article page');
    return false;
  }

  // Show banner and redirect
  function showBanner() {
    LOG('showBanner called, existing banner?', !!document.getElementById('freedium-banner'));
    if (document.getElementById('freedium-banner')) return;
    LOG('showBanner: CREATING BANNER for', window.location.href);

    const mediumUrl = window.location.href;
    const freediumUrl = `${FREEDIUM_BASE}/${mediumUrl}?utm_source=extension&utm_medium=browser&utm_campaign=freedium`;

    // Build banner with inline styles (no <style> tag — defeats CSP)
    const banner = document.createElement('div');
    banner.id = 'freedium-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:linear-gradient(135deg,#00ab6c 0%,#1a8917 100%);color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 12px rgba(0,0,0,0.2);font-size:14px;';

    // Left side: text + countdown
    const textDiv = document.createElement('div');
    textDiv.style.cssText = 'display:flex;align-items:center;gap:8px;';

    const icon = document.createElement('span');
    icon.textContent = '📰';

    const label = document.createElement('span');
    label.style.opacity = '0.9';
    label.textContent = 'Read this article free on Freedium';

    const countdown = document.createElement('span');
    countdown.id = 'fb-countdown';
    countdown.style.cssText = 'opacity:0.7;font-size:12px;margin-left:8px;';
    countdown.textContent = 'Auto-opening in 5s...';

    textDiv.append(icon, label, countdown);

    // Right side: love + buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display:flex;gap:8px;align-items:center;';

    const loveDiv = document.createElement('div');
    loveDiv.style.cssText = 'opacity:0.75;font-size:11px;display:flex;align-items:center;gap:4px;';
    loveDiv.innerHTML = 'Made with ❤️ · <a href="https://www.skool.com/ai-pays-my-bills-7018" target="_blank" style="color:#fff;text-decoration:underline;opacity:0.9;">Support us</a>';

    const openBtn = document.createElement('button');
    openBtn.id = 'fb-open';
    openBtn.textContent = 'Open Freedium';
    openBtn.style.cssText = 'border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:13px;font-weight:600;background:#fff;color:#1a8917;';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'fb-close';
    closeBtn.textContent = 'Stay on Medium';
    closeBtn.style.cssText = 'border:none;border-radius:6px;padding:8px 16px;cursor:pointer;font-size:13px;font-weight:600;background:rgba(255,255,255,0.2);color:#fff;';

    actionsDiv.append(loveDiv, openBtn, closeBtn);
    banner.append(textDiv, actionsDiv);

    // Insert into body (not documentElement — more reliable)
    (document.body || document.documentElement).prepend(banner);
    LOG('Banner inserted into DOM, offsetHeight:', banner.offsetHeight);

    // Push body down
    if (document.body) document.body.style.marginTop = (banner.offsetHeight + 10) + 'px';

    // Countdown
    let seconds = 5;
    const timer = setInterval(() => {
      seconds--;
      LOG('Countdown:', seconds);
      if (seconds <= 0) {
        clearInterval(timer);
        LOG('REDIRECTING to', freediumUrl);
        window.location.href = freediumUrl;
        return;
      }
      countdown.textContent = `Auto-opening in ${seconds}s...`;
    }, 1000);

    // Buttons
    openBtn.addEventListener('click', () => {
      clearInterval(timer);
      chrome.runtime.sendMessage({ action: 'increment', url: mediumUrl });
      window.location.href = freediumUrl;
    });

    closeBtn.addEventListener('click', () => {
      clearInterval(timer);
      banner.remove();
      if (document.body) document.body.style.marginTop = '';
    });

    // Protect banner from being removed by Medium's JS
    const protector = new MutationObserver(() => {
      if (!document.getElementById('freedium-banner')) {
        LOG('Banner was removed! Re-inserting...');
        (document.body || document.documentElement).prepend(banner);
      }
    });
    protector.observe(document.documentElement, { childList: true, subtree: true });

    // Track
    chrome.runtime.sendMessage({ action: 'increment', url: mediumUrl });
  }

  // Medium links on non-Medium pages open normally in new tab
  // Content.js in the new tab will show the banner with countdown

  // Watch for dynamically added links
  const observer = new MutationObserver((mutations) => {
    // Check if we just loaded a Medium page
    if (isMediumArticlePage() && !document.getElementById('freedium-banner')) {
      showBanner();
    }
  });

  // Run on existing page
  LOG('Initial check: isMediumArticlePage =', isMediumArticlePage(), 'readyState:', document.readyState);
  if (isMediumArticlePage()) {
    if (document.readyState === 'loading') {
      LOG('Waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      LOG('Calling showBanner immediately');
      showBanner();
    }
  }

  // Start observing
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
