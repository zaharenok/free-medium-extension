// Medium domains to intercept
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
  'writing cooperative.com',
  'proandroiddev.com',
  'android-ui.dev',
];

const FREEDIUM_BASE = 'https://freedium.cfd';

// Check if URL is a Medium article
function isMediumUrl(url) {
  try {
    const u = new URL(url);
    return MEDIUM_DOMAINS.some(d => u.hostname === d || u.hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

// Convert Medium URL to Freedium mirror URL
function toFreediumUrl(mediumUrl) {
  return `${FREEDIUM_BASE}/${mediumUrl}`;
}

// Counter storage
async function getStats() {
  const { stats } = await chrome.storage.local.get('stats');
  return stats || { count: 0, date: new Date().toDateString(), urls: [] };
}

async function incrementCounter(url) {
  const stats = await getStats();
  const today = new Date().toDateString();

  if (stats.date !== today) {
    stats.count = 0;
    stats.urls = [];
    stats.date = today;
  }

  stats.count++;
  if (!stats.urls.includes(url)) {
    stats.urls.push(url);
  }

  await chrome.storage.local.set({ stats });
  return stats;
}

// Badge update
function updateBadge(count) {
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#00ab6c' });
}

// Init badge
getStats().then(s => updateBadge(s.count));

// Redirect on Medium article navigation
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return;
  if (!isMediumUrl(details.url)) return;

  incrementCounter(details.url).then(stats => {
    updateBadge(stats.count);
  });

  // Let content script handle the banner
});

// Message handler from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    getStats().then(sendResponse);
    return true;
  }
  if (request.action === 'increment') {
    incrementCounter(request.url).then(stats => {
      updateBadge(stats.count);
      sendResponse(stats);
    });
    return true;
  }
  if (request.action === 'toFreedium') {
    sendResponse({ url: toFreediumUrl(request.url) });
    return true;
  }
});
