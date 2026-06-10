(() => {
  'use strict';

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
  ];

  function isMediumUrl(url) {
    try {
      const u = new URL(url);
      return MEDIUM_DOMAINS.some(d => u.hostname === d || u.hostname.endsWith('.' + d));
    } catch {
      return false;
    }
  }

  // Check if current page is a Medium article
  function isMediumArticlePage() {
    const url = window.location.href;
    if (!isMediumUrl(url)) return false;

    // Medium articles have /@user/slug pattern or are on subdomain
    const path = window.location.pathname;
    if (path.match(/^\/@[\w-]+\/[\w-]+/)) return true;
    // Tag pages, publication pages with /p/ etc
    if (path.match(/^\/p\//)) return true;

    // Fallback: check for Medium meta tags
    const meta = document.querySelector('meta[property="al:android:app_name"]');
    if (meta && meta.content === 'Medium') return true;

    return false;
  }

  // Show banner and redirect
  function showBanner() {
    if (document.getElementById('freedium-banner')) return;

    const mediumUrl = window.location.href;
    const freediumUrl = `${FREEDIUM_BASE}/${mediumUrl}?utm_source=extension&utm_medium=browser&utm_campaign=freedium`;

    const style = document.createElement('style');
    style.textContent = `
      #freedium-banner {
        position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;
        background: linear-gradient(135deg, #00ab6c 0%, #1a8917 100%);
        color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 10px 20px; display: flex; align-items: center; justify-content: space-between;
        box-shadow: 0 2px 12px rgba(0,0,0,0.2); font-size: 14px;
        animation: freedium-slide-down 0.3s ease-out;
      }
      @keyframes freedium-slide-down {
        from { transform: translateY(-100%); } to { transform: translateY(0); }
      }
      #freedium-banner .fb-text { display: flex; align-items: center; gap: 8px; }
      #freedium-banner .fb-text span { opacity: 0.9; }
      #freedium-banner .fb-actions { display: flex; gap: 8px; align-items: center; }
      #freedium-banner button {
        border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer;
        font-size: 13px; font-weight: 600; transition: all 0.15s;
      }
      .fb-open { background: #fff; color: #1a8917; }
      .fb-open:hover { background: #f0f0f0; }
      .fb-close { background: rgba(255,255,255,0.2); color: #fff; }
      .fb-close:hover { background: rgba(255,255,255,0.3); }
      .fb-countdown { opacity: 0.7; font-size: 12px; margin-left: 8px; }
      .fb-love {
        opacity: 0.75; font-size: 11px; display: flex; align-items: center; gap: 4px;
      }
      .fb-love a {
        color: #fff; text-decoration: underline; opacity: 0.9;
      }
      .fb-love a:hover { opacity: 1; }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'freedium-banner';
    banner.innerHTML = `
      <div class="fb-text">
        <span>📰</span>
        <span>Read this article free on Freedium</span>
        <span class="fb-countdown" id="fb-countdown">Auto-opening in 3s...</span>
      </div>
      <div class="fb-actions">
        <div class="fb-love">Made with ❤️ · <a href="https://www.skool.com/ai-pays-my-bills-7018" target="_blank">Support us</a></div>
        <button class="fb-open" id="fb-open">Open Freedium</button>
        <button class="fb-close" id="fb-close">Stay on Medium</button>
      </div>
    `;
    document.documentElement.prepend(banner);

    // Push body down
    document.body.style.marginTop = (banner.offsetHeight + 10) + 'px';

    // Countdown
    let seconds = 3;
    const countdownEl = document.getElementById('fb-countdown');
    const timer = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(timer);
        window.location.href = freediumUrl;
        return;
      }
      countdownEl.textContent = `Auto-opening in ${seconds}s...`;
    }, 1000);

    // Buttons
    document.getElementById('fb-open').addEventListener('click', () => {
      clearInterval(timer);
      chrome.runtime.sendMessage({ action: 'increment', url: mediumUrl });
      window.location.href = freediumUrl;
    });

    document.getElementById('fb-close').addEventListener('click', () => {
      clearInterval(timer);
      banner.remove();
      document.body.style.marginTop = '';
    });

    // Track
    chrome.runtime.sendMessage({ action: 'increment', url: mediumUrl });
  }

  // Intercept clicks on Medium links on non-Medium pages
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Resolve relative URLs
    const fullUrl = new URL(href, window.location.origin).href;
    if (isMediumUrl(fullUrl)) {
      e.preventDefault();
      e.stopPropagation();
      window.open(`${FREEDIUM_BASE}/${fullUrl}`, '_blank');
    }
  }, true);

  // Watch for dynamically added links
  const observer = new MutationObserver((mutations) => {
    // Check if we just loaded a Medium page
    if (isMediumArticlePage() && !document.getElementById('freedium-banner')) {
      showBanner();
    }
  });

  // Run on existing page
  if (isMediumArticlePage()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
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
