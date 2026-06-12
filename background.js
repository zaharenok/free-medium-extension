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
  'writingcooperative.com',
  'proandroiddev.com',
  'android-ui.dev',
];

const FREEDIUM_BASE = 'https://freedium-mirror.cfd';

// GA4 Measurement Protocol
const GA4_MEASUREMENT_ID = 'G-0BYNWSVBWY';
const GA4_API_SECRET = 'PcU4kGVMQVa-ScarRQkiaQ';

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
  const url = new URL(`${FREEDIUM_BASE}/${mediumUrl}`);
  url.searchParams.set('utm_source', 'extension');
  url.searchParams.set('utm_medium', 'browser');
  url.searchParams.set('utm_campaign', 'freedium');
  return url.toString();
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

  // GA4 event
  sendGa4Event('freedium_redirect', { url });

  return stats;
}

// GA4 Measurement Protocol sender
function sendGa4Event(name, params = {}) {
  const clientId = crypto.randomUUID();
  const payload = {
    client_id: clientId,
    events: [{
      name,
      params: {
        ...params,
        session_id: clientId.slice(0, 8),
        engagement_time_msec: 1,
      },
    }],
  };

  fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
    { method: 'POST', body: JSON.stringify(payload) }
  ).catch(() => {}); // тихо глушим ошибки
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
  if (request.action === 'track') {
    sendGa4Event(request.event, request.params || {});
    sendResponse({ ok: true });
    return false;
  }
});
