import { useState, useEffect, useRef } from "react";

const SYNC_EVENT = "luxen-storage-sync";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValueRef.current;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValueRef.current;
    } catch {
      return initialValueRef.current;
    }
  });

  // Listen for changes from OTHER component instances (same window)
  // so that setting auth in Login immediately re-renders AppRoutes
  useEffect(() => {
    const handleSync = (e: Event) => {
      const ev = e as CustomEvent<{ key: string }>;
      if (ev.detail?.key === key) {
        try {
          const item = window.localStorage.getItem(key);
          setStoredValue(item ? (JSON.parse(item) as T) : initialValueRef.current);
        } catch {}
      }
    };
    window.addEventListener(SYNC_EVENT, handleSync);
    return () => window.removeEventListener(SYNC_EVENT, handleSync);
  }, [key]); // key is the only real dep; initialValueRef is stable

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Broadcast to every useLocalStorage instance watching the same key
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
      }
    } catch {}
  };

  return [storedValue, setValue] as const;
}
