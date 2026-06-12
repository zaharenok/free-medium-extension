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
    // Publication articles: /short-name/article-slug (2+ segments)
    const segments = path.split('/').filter(Boolean);
    LOG('segments:', segments, 'hostname:', window.location.hostname);
    if (segments.length >= 2 && !segments[0].startsWith('@') && segments[0] !== 'p') { LOG('=> matched publication/slug'); return true; }
    // Subdomain blogs: pinetwork-official.medium.com/article-slug-id (1 segment on a subdomain)
    if (segments.length === 1 && window.location.hostname !== 'medium.com') { LOG('=> matched subdomain article'); return true; }

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

    const domain = window.location.hostname;

    const mediumUrl = window.location.href;
    const freediumUrl = `${FREEDIUM_BASE}/${mediumUrl}?utm_source=extension&utm_medium=browser&utm_campaign=freedium`;

    // Build banner — two rows, big, inline styles (no <style> tag — defeats CSP)
    const banner = document.createElement('div');
    banner.id = 'freedium-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:linear-gradient(135deg,#00ab6c 0%,#1a8917 100%);color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:14px 24px;box-shadow:0 4px 20px rgba(0,0,0,0.3);';

    // Row 1: main text + countdown + buttons
    const row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px;';

    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'display:flex;align-items:center;gap:10px;font-size:16px;font-weight:600;';
    textWrap.textContent = '📰 Read this article free on Freedium';

    const countdown = document.createElement('span');
    countdown.id = 'fb-countdown';
    countdown.style.cssText = 'opacity:0.8;font-size:14px;font-weight:400;margin-left:6px;';
    countdown.textContent = 'Auto-opening in 10s...';
    textWrap.appendChild(countdown);

    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;gap:8px;';

    const openBtn = document.createElement('button');
    openBtn.id = 'fb-open';
    openBtn.textContent = 'Open Freedium';
    openBtn.style.cssText = 'border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-size:14px;font-weight:700;background:#fff;color:#1a8917;box-shadow:0 2px 8px rgba(0,0,0,0.15);';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'fb-close';
    closeBtn.textContent = 'Stay on Medium';
    closeBtn.style.cssText = 'border:2px solid rgba(255,255,255,0.5);border-radius:8px;padding:8px 16px;cursor:pointer;font-size:13px;font-weight:600;background:transparent;color:#fff;';

    btnWrap.append(openBtn, closeBtn);
    row1.append(textWrap, btnWrap);

    // Row 2: prominent Skool link
    const row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.25);font-size:14px;';

    const heart = document.createElement('span');
    heart.textContent = 'Made with ❤️ ·';

    const loveLink = document.createElement('a');
    loveLink.href = 'https://www.skool.com/ai-pays-my-bills-7018';
    loveLink.target = '_blank';
    loveLink.textContent = '🌟 Support us — join our community!';
    loveLink.style.cssText = 'color:#fff;font-weight:700;font-size:15px;text-decoration:underline;text-underline-offset:3px;';

    row2.append(heart, loveLink);

    banner.append(row1, row2);

    // Insert into body
    (document.body || document.documentElement).prepend(banner);
    LOG('Banner inserted into DOM, offsetHeight:', banner.offsetHeight);

    // Push body down
    if (document.body) document.body.style.marginTop = (banner.offsetHeight + 10) + 'px';

    // Countdown
    let seconds = 10;
    const timer = setInterval(() => {
      seconds--;
      LOG('Countdown:', seconds);
      if (seconds <= 0) {
        clearInterval(timer);
        LOG('REDIRECTING to', freediumUrl);
        chrome.runtime.sendMessage({ action: 'track', event: 'auto_redirect', params: { domain, url: mediumUrl } });
        window.location.href = freediumUrl;
        return;
      }
      countdown.textContent = `Auto-opening in ${seconds}s...`;
    }, 1000);

    // Buttons
    openBtn.addEventListener('click', () => {
      clearInterval(timer);
      chrome.runtime.sendMessage({ action: 'track', event: 'open_click', params: { domain, url: mediumUrl } });
      chrome.runtime.sendMessage({ action: 'increment', url: mediumUrl });
      window.location.href = freediumUrl;
    });

    closeBtn.addEventListener('click', () => {
      clearInterval(timer);
      chrome.runtime.sendMessage({ action: 'track', event: 'stay_click', params: { domain, url: mediumUrl } });
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

    // Track banner shown
    chrome.runtime.sendMessage({ action: 'track', event: 'banner_shown', params: { domain, url: mediumUrl } });
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
