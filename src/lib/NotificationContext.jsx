import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

const KEY = 'gmos_notifications';
const MAX = 50;
let counter = 0;

// System notifications, persisted across navigation and reloads. Components
// raise events via useNotifications().notify(...).
export function NotificationProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX))); } catch { /* ignore */ }
  }, [items]);

  const notify = useCallback(({ title, body = '', type = 'info' }) => {
    if (!title) return;
    setItems((prev) => [
      { id: `${Date.now()}-${counter++}`, title, body, type, ts: Date.now(), read: false },
      ...prev,
    ].slice(0, MAX));
  }, []);

  const markAllRead = useCallback(() => setItems((prev) => prev.map((n) => ({ ...n, read: true }))), []);
  const clear = useCallback(() => setItems([]), []);

  const unread = items.reduce((n, i) => n + (i.read ? 0 : 1), 0);

  return (
    <NotificationContext.Provider value={{ items, unread, notify, markAllRead, clear }}>
      {children}
    </NotificationContext.Provider>
  );
}
