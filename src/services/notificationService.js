// src/services/notificationService.js

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ─── Register Service Worker ───────────────────────────────────────────────────
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('✅ Service Worker registered');
    return reg;
  } catch (err) {
    console.error('❌ SW registration failed:', err);
    return null;
  }
}

// ─── Request Permission ────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// ─── Subscribe User ────────────────────────────────────────────────────────────
export async function subscribeToPush(userId) {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.warn('Notification permission denied');
      return false;
    }

    const reg = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Save subscription to backend
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, subscription }),
    });

    console.log('✅ Push subscription saved');
    return true;
  } catch (err) {
    console.error('❌ Push subscription failed:', err);
    return false;
  }
}

// ─── Unsubscribe User ──────────────────────────────────────────────────────────
export async function unsubscribeFromPush(userId) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;

    await subscription.unsubscribe();

    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    console.log('✅ Unsubscribed from push');
  } catch (err) {
    console.error('❌ Unsubscribe failed:', err);
  }
}

// ─── Check Status ──────────────────────────────────────────────────────────────
export function getNotificationStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// ─── Initialize (call on login) ────────────────────────────────────────────────
export async function initNotifications(userId) {
  if (!userId) return;
  await registerServiceWorker();
  await subscribeToPush(userId);
}
