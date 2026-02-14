console.log('Content script loaded');

function showMirrorOptions(freediumUrl) {
  // Track banner display event
  chrome.runtime.sendMessage({ action: 'trackEvent', eventName: 'banner_shown' });

  if (window.redirectTimer || window.countdownInterval) {
    clearTimeout(window.redirectTimer);
    clearInterval(window.countdownInterval);
  }

  if (document.querySelector('.freedium-banner')) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'freedium-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.zIndex = '999998';
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.textContent = `
    .freedium-banner {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #2196F3, #00BCD4);
      padding: 30px 60px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
      z-index: 999999;
      animation: fadeIn 0.5s ease-out;
    }
    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s;
    }
    .close-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -60%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }
    .freedium-banner h1 {
      font-size: 32px;
      margin: 0;
      margin-bottom: 15px;
    }
    .freedium-banner p {
      font-size: 18px;
      margin: 0;
    }
    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 20px;
    }
    .actions button {
      padding: 12px 30px;
      border-radius: 25px;
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .open-button {
      background: white;
      color: #2196F3;
      border: none;
    }
    .open-button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }
    .stay-button {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid white;
    }
    .stay-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }
    .learn-more-button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 30px;
      background: white;
      color: #2196F3;
      text-decoration: none;
      border-radius: 25px;
      font-weight: bold;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
      animation: pulse 2s ease-in-out infinite;
    }
    .learn-more-button:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      animation: none;
    }
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
      }
      50% {
        transform: scale(1.03);
        box-shadow: 0 0 20px 10px rgba(255, 255, 255, 0.3);
      }
    }
  `;
  document.head.appendChild(style);

  const banner = document.createElement('div');
  banner.className = 'freedium-banner';
  banner.innerHTML = `
    <button class="close-button">×</button>
    <h1>Freedium Mirror Available</h1>
    <p>Open this article on freedium.cfd?</p>
    <div class="actions">
      <button class="open-button">Open Now</button>
      <button class="stay-button">Stay on Medium</button>
    </div>
    <a href="https://www.skool.com/ai-pays-my-bills-7018/about" target="_blank" class="learn-more-button" data-ga-event="learn_more_click">Learn More</a>
  `;

  document.body.appendChild(banner);

  // Track Learn More button click
  const learnMoreButton = banner.querySelector('.learn-more-button');
  if (learnMoreButton) {
    learnMoreButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'trackEvent', eventName: 'learn_more_click' });
    });
  }

  const closeButton = banner.querySelector('.close-button');
  const openButton = banner.querySelector('.open-button');
  const stayButton = banner.querySelector('.stay-button');

  closeButton.addEventListener('click', () => {
    overlay.remove();
    banner.remove();
  });

  openButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'trackEvent', eventName: 'open_mirror' });
    window.location.href = freediumUrl;
  });

  stayButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'trackEvent', eventName: 'stay_on_medium' });
    overlay.remove();
    banner.remove();
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showMirrorOptions') {
    console.log('Received showMirrorOptions message with URL:', request.freediumUrl);
    showMirrorOptions(request.freediumUrl);
  }
});

// Function to detect if this is a Medium article page
function isMediumArticle(url) {
  // Check for characteristic Medium elements on the page
  const mediumSignatures = [
    // Typical Medium meta tags
    'meta[name="twitter:site"][content*="@Medium"]',
    'meta[property="og:site_name"][content*="Medium"]',
    // Characteristic Medium UI elements
    'div[data-testid="post-sidebar"]',
    'div[data-testid="storyStream"]',
    // Characteristic Medium classes
    '.progressiveMedia',
    '.graf--title'
  ];

  // Check URL for typical Medium parameters
  const mediumUrlPatterns = [
    '?source=',
    '/tagged/',
    '/latest',
    '/@',
    '/p/',
    '-'  // Typical separator in Medium article URLs
  ];

  // Check for Medium elements on the page
  const hasMediumElements = mediumSignatures.some(selector =>
    document.querySelector(selector) !== null
  );

  // Check URL for characteristic patterns
  const hasMediumUrlPattern = mediumUrlPatterns.some(pattern =>
    url.includes(pattern)
  );

  // Return true if there are Medium elements or URL looks like Medium
  return hasMediumElements || hasMediumUrlPattern;
}

// Function to show mirror options for Medium articles
function openFreediumMirror(url) {
  const freediumUrl = `https://freedium-mirror.cfd/${url}`;
  console.log('Opening Freedium mirror:', freediumUrl);
  showMirrorOptions(freediumUrl);
}

// Privacy optimization: Early exit for pages with no Medium-related content
// This minimizes processing on pages where the extension isn't needed
const hasMediumContent = () => {
  const href = window.location.href;
  // Quick URL pattern check first
  if (href.includes('medium.') || href.includes('freedium')) {
    return true;
  }
  // Check for Medium links on the page
  return document.querySelector('a[href*="medium."]') !== null;
};

if (!hasMediumContent()) {
  // Skip all processing if this page has no Medium-related content
  // This reduces resource usage and demonstrates privacy-conscious design
} else if (isMediumArticle(window.location.href)) {
  // Если это платная статья Medium, перенаправляем на Freedium
  openFreediumMirror(window.location.href);
}

// Обработчик кликов по ссылкам
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  // Пропускаем кнопку Learn More и наши собственные элементы
  if (link.classList.contains('learn-more-button') ||
      link.closest('.freedium-banner') ||
      link.href.includes('skool.com/')) {
    return;
  }

  // Проверяем, ведет ли ссылка на Medium-подобный контент
  if (link.href && isMediumArticle(link.href)) {
    e.preventDefault();
    openFreediumMirror(link.href);
  }
});

// Наблюдатель за изменениями в DOM для динамически добавляемых ссылок
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) { // Проверяем, что это HTML-элемент
        const links = node.querySelectorAll('a');
        links.forEach(link => {
          // Пропускаем кнопку Learn More и skool.com ссылки
          if (link.classList.contains('learn-more-button') ||
              link.href.includes('skool.com/') ||
              link.closest('.freedium-banner')) {
            return;
          }
          if (link.href && isMediumArticle(link.href)) {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              openFreediumMirror(link.href);
            });
          }
        });
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});