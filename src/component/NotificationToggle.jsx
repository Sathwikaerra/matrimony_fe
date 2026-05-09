// src/components/NotificationToggle.jsx
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationToggle({ userId }) {
  const { status, loading, enable, disable } = useNotifications(userId);

  if (status === 'unsupported') return null;

  return (
    <div className="flex items-center gap-2">
      {status === 'granted' ? (
        <button
          onClick={disable}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-700 hover:bg-green-200 transition"
          title="Notifications ON — click to disable"
        >
          🔔 {loading ? 'Updating...' : 'Notifications On'}
        </button>
      ) : status === 'denied' ? (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          🔕 Notifications blocked
          <a
            href="https://support.google.com/chrome/answer/3220216"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            (how to enable)
          </a>
        </span>
      ) : (
        <button
          onClick={enable}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-pink-100 text-pink-700 hover:bg-pink-200 transition"
          title="Enable push notifications"
        >
          🔕 {loading ? 'Enabling...' : 'Enable Notifications'}
        </button>
      )}
    </div>
  );
}
