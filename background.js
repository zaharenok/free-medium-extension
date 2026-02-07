// Массив доменов Medium, которые нужно перехватывать
const mediumBaseDomains = [
  'medium.com',
  'generativeai.pub',
  'towardsdatascience.com',
  'bettermarketing.pub',
  'bootcamp.uxdesign.cc',
  'plainenglish.io'
];

// Функция для обновления счетчика
async function updateCounter(url) {
  try {
    // Получаем текущую дату в формате YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Получаем текущую статистику
    const result = await chrome.storage.local.get(['articleStats']);
    let stats = result.articleStats || {};
    
    // Инициализируем статистику за сегодня, если её нет
    if (!stats[today]) {
      stats[today] = {
        count: 0,
        articles: []
      };
    }

    // Проверяем, не была ли эта статья уже посещена сегодня
    if (!stats[today].articles.includes(url)) {
      stats[today].count++;
      stats[today].articles.push(url);
      
      // Сохраняем обновленную статистику
      await chrome.storage.local.set({ articleStats: stats });
      
      // Отправляем обновленный счетчик в content script
      return stats[today].count;
    }
    
    return stats[today].count;
  } catch (err) {
    console.error('Error updating counter:', err);
    return null;
  }
}

// Функция для проверки премиум-статуса
async function checkPremiumStatus() {
  const result = await chrome.storage.local.get(['premiumUntil']);
  if (!result.premiumUntil) return false;
  
  // Проверяем, не истек ли срок премиума
  return new Date(result.premiumUntil) > new Date();
}

// Обновляем существующий listener
chrome.webNavigation.onCompleted.addListener(async (details) => {
  try {
    const url = new URL(details.url);
    
    // Пропускаем главную страницу medium.com
    if (url.hostname === 'medium.com' && url.pathname === '/') {
      return;
    }
    
    // Пропускаем если это уже freedium
    if (url.hostname === 'freedium-mirror.cfd') {
      return;
    }

    // Проверяем премиум-статус
    const isPremium = await checkPremiumStatus();

    if (mediumBaseDomains.some(domain => 
      url.hostname === domain || 
      url.hostname.endsWith('.' + domain)
    )) {
      const freediumUrl = `https://freedium-mirror.cfd${url.pathname}${url.search}`;
      
      // Если премиум - делаем редирект без баннера
      if (isPremium) {
        chrome.tabs.update(details.tabId, { url: freediumUrl });
        return;
      }
      
      // Если нет премиума - показываем баннер
      const currentCount = await updateCounter(details.url);
      chrome.tabs.sendMessage(details.tabId, {
        action: 'showBanner',
        freediumUrl: freediumUrl,
        articlesCount: currentCount,
        isPremium: false
      });
    }
  } catch (err) {
    console.error('Error in navigation handler:', err);
  }
});

// Добавляем обработчик для активации премиума
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'activatePremium') {
    try {
      // Устанавливаем срок действия премиума (например, на 30 дней)
      const premiumUntil = new Date();
      premiumUntil.setDate(premiumUntil.getDate() + 30);
      
      await chrome.storage.local.set({ 
        premiumUntil: premiumUntil.toISOString() 
      });
      
      sendResponse({ success: true });
    } catch (err) {
      console.error('Error activating premium:', err);
      sendResponse({ success: false, error: err.message });
    }
  }
});