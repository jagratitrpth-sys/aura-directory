import { useEffect, useState } from "react";

/**
 * Tracks browser online/offline state via navigator.onLine + window events.
 * Used to surface an offline indicator when the network drops. Local features
 * (autocomplete, fuzzy search) keep working — the indicator just reassures
 * the user that search is still functional.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
