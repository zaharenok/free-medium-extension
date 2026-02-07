console.log('Content script loaded');

function showBanner(freediumUrl) {
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
    .countdown {
      font-size: 24px;
      font-weight: bold;
      margin-top: 10px;
    }
  `;
  document.head.appendChild(style);

  const banner = document.createElement('div');
  banner.className = 'freedium-banner';
  banner.innerHTML = `
    <button class="close-button">×</button>
    <h1>Free Internet for All!</h1>
    <p>Redirecting in <span class="countdown">10</span> seconds...</p>
  `;

  document.body.appendChild(banner);

  const closeButton = banner.querySelector('.close-button');
  const countdownElement = banner.querySelector('.countdown');
  let secondsLeft = 10;

  closeButton.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите закрыть баннер?')) {
      overlay.remove();
      banner.remove();
      clearInterval(window.countdownInterval);
      clearTimeout(window.redirectTimer);
    }
  });

  window.countdownInterval = setInterval(() => {
    secondsLeft--;
    if (countdownElement) {
      countdownElement.textContent = secondsLeft;
    }
    if (secondsLeft <= 0) {
      clearInterval(window.countdownInterval);
    }
  }, 1000);

  window.redirectTimer = setTimeout(() => {
    window.location.href = freediumUrl;
  }, 10000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showBanner') {
    console.log('Received showBanner message with URL:', request.freediumUrl);
    showBanner(request.freediumUrl);
  }
});

// Функция для определения, является ли страница статьей Medium
function isMediumArticle(url) {
  // Проверяем наличие характерных элементов Medium на странице
  const mediumSignatures = [
    // Типичные мета-теги Medium
    'meta[name="twitter:site"][content*="@Medium"]',
    'meta[property="og:site_name"][content*="Medium"]',
    // Характерные элементы интерфейса Medium
    'div[data-testid="post-sidebar"]',
    'div[data-testid="storyStream"]',
    // Характерные классы Medium
    '.progressiveMedia',
    '.graf--title',
    // Проверка на наличие платного контента
    'div[class*="paywall"]',
    'div[class*="membership-prompt"]',
    '.meteredContent'
  ];

  // Проверяем URL на наличие типичных параметров Medium
  const mediumUrlPatterns = [
    '?source=',
    '/tagged/',
    '/latest',
    '/@',
    '/p/',
    '-'  // Типичный разделитель в URL статей Medium
  ];

  // Проверяем наличие элементов Medium на странице
  const hasMediumElements = mediumSignatures.some(selector => 
    document.querySelector(selector) !== null
  );

  // Проверяем URL на характерные паттерны
  const hasMediumUrlPattern = mediumUrlPatterns.some(pattern => 
    url.includes(pattern)
  );

  // Проверяем наличие платного контента
  const hasPaywall = document.querySelector('div[class*="paywall"]') !== null ||
                    document.querySelector('.meteredContent') !== null;

  // Возвращаем true если есть элементы Medium или URL похож на Medium
  return hasMediumElements || (hasMediumUrlPattern && hasPaywall);
}

// Функция для перенаправления на Freedium
function redirectToFreedium(url) {
  const freediumUrl = `https://freedium-mirror.cfd/${url}`;
  console.log('Перенаправление на Freedium:', freediumUrl);
  showBanner(freediumUrl);
}

// Проверяем текущую страницу
if (isMediumArticle(window.location.href)) {
  // Если это платная статья Medium, перенаправляем на Freedium
  redirectToFreedium(window.location.href);
}

// Обработчик кликов по ссылкам
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  // Проверяем, ведет ли ссылка на Medium-подобный контент
  if (link.href && isMediumArticle(link.href)) {
    e.preventDefault();
    redirectToFreedium(link.href);
  }
});

// Наблюдатель за изменениями в DOM для динамически добавляемых ссылок
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) { // Проверяем, что это HTML-элемент
        const links = node.querySelectorAll('a');
        links.forEach(link => {
          if (link.href && isMediumArticle(link.href)) {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              redirectToFreedium(link.href);
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