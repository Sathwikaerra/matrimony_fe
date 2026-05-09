// public/sw.js — Matrimony Push Notification Service Worker

const APP_NAME = 'MatrimonyApp';

// ─── Push Event ────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: APP_NAME, body: event.data.text(), type: 'general' };
  }

  const { title, body, type, senderId, data = {} } = payload;

  // Icon per notification type
  const iconMap = {
    message:   '/icons/message.png',
    match:     '/icons/match.png',
    view:      '/icons/view.png',
    interest:  '/icons/interest.png',
  };

  const badgeMap = {
    message:   '/icons/badge-message.png',
    match:     '/icons/badge-match.png',
    view:      '/icons/badge-view.png',
    interest:  '/icons/badge-interest.png',
  };

  const options = {
    body,
    icon:  iconMap[type]  || '/icons/default.png',
    badge: badgeMap[type] || '/icons/badge.png',
    vibrate: [200, 100, 200],
    tag: `${type}-${senderId || Date.now()}`,   // replaces duplicate notifications
    renotify: true,
    data: { type, senderId, url: data.url || '/', ...data },
    actions: getActions(type),
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { type, senderId, url } = event.notification.data || {};
  const action = event.action;

  let targetUrl = url || '/';

  if (action === 'reply' || type === 'message') {
    targetUrl = senderId ? `/messages/${senderId}` : '/messages';
  } else if (action === 'view' || type === 'match' || type === 'interest') {
    targetUrl = senderId ? `/profile/${senderId}` : '/matches';
  } else if (type === 'view') {
    targetUrl = '/profile/views';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return;
        }
      }
      // Open new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getActions(type) {
  switch (type) {
    case 'message':
      return [
        { action: 'reply', title: '💬 Reply' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'match':
      return [
        { action: 'view', title: '👁️ View Profile' },
        { action: 'dismiss', title: 'Later' },
      ];
    case 'interest':
      return [
        { action: 'view', title: '❤️ View Profile' },
        { action: 'dismiss', title: 'Later' },
      ];
    default:
      return [];
  }
}
