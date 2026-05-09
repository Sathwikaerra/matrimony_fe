// src/hooks/useNotifications.js
import { useEffect, useState } from 'react';
import {
  initNotifications,
  unsubscribeFromPush,
  getNotificationStatus,
  requestNotificationPermission,
  subscribeToPush,
} from '../services/notificationService';

export function useNotifications(userId) {
  const [status, setStatus] = useState(getNotificationStatus()); // 'default' | 'granted' | 'denied' | 'unsupported'
  const [loading, setLoading] = useState(false);

  // Auto-init when user logs in
  useEffect(() => {
    if (!userId) return;
    if (Notification.permission === 'granted') {
      initNotifications(userId);
      setStatus('granted');
    }
  }, [userId]);

  // Listen for SW navigate messages (notification click → route change)
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === 'NAVIGATE') {
        window.location.href = event.data.url;
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, []);

  const enable = async () => {
    setLoading(true);
    const granted = await requestNotificationPermission();
    if (granted) {
      await subscribeToPush(userId);
      setStatus('granted');
    } else {
      setStatus('denied');
    }
    setLoading(false);
  };

  const disable = async () => {
    setLoading(true);
    await unsubscribeFromPush(userId);
    setStatus('default');
    setLoading(false);
  };

  return { status, loading, enable, disable };
}
