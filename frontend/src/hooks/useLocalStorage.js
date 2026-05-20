import { useState, useCallback, useEffect } from "react";

export const useLocalStorage = (key, initialValue) => {
  const isBrowser = typeof window !== "undefined";

  const readValue = useCallback(() => {
    if (!isBrowser) return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue, isBrowser]);

  const [storedValue, setStoredValue] = useState(readValue);

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (isBrowser) {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch {}
    },
    [key, storedValue, isBrowser]
  );

  const removeValue = useCallback(() => {
    try {
      if (isBrowser) {
        window.localStorage.removeItem(key);
      }
      setStoredValue(undefined);
    } catch {}
  }, [key, isBrowser]);

  useEffect(() => {
    if (!isBrowser) return;

    const handler = (event) => {
      if (event.key === key) {
        setStoredValue(event.newValue ? JSON.parse(event.newValue) : undefined);
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, isBrowser]);

  return {
    value: storedValue,
    setValue,
    removeValue,
  };
};