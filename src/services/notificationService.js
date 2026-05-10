// src/services/notificationService.js
import { requestForToken } from "../firebase-config";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

// ─── Subscribe User (FCM) ──────────────────────────────────────────────────────
export async function subscribeToPush(userId) {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.warn('Notification permission denied');
      return false;
    }

    // Get FCM Token
    const fcmToken = await requestForToken();
    if (!fcmToken) {
      console.warn('Could not retrieve FCM token');
      return false;
    }

    // Save token to backend
    const authToken = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/notifications/save-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken, deviceType: 'web' }),
    });

    console.log('✅ FCM Token saved to backend');
    return true;
  } catch (err) {
    console.error('❌ FCM subscription failed:', err);
    return false;
  }
}

// ─── Unsubscribe User ──────────────────────────────────────────────────────────
export async function unsubscribeFromPush(userId) {
  try {
    const fcmToken = await requestForToken();
    if (!fcmToken) return;

    const authToken = localStorage.getItem('token');
    await fetch(`${API_BASE}/api/notifications/remove-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken }),
    });

    console.log('✅ FCM Token removed from backend');
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
  
  // Register Service Worker if needed (Firebase does this mostly, but we can ensure)
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Firebase Service Worker registered');
    } catch (err) {
      console.error('❌ Firebase SW registration failed:', err);
    }
  }

  await subscribeToPush(userId);
}

