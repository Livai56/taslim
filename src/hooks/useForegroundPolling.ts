import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export function useForegroundPolling(callback: () => void | Promise<void>, intervalMs: number, enabled = true) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    let isActive = AppState.currentState === "active";
    let isRequestInFlight = false;

    async function poll() {
      if (!isActive || isRequestInFlight) return;
      isRequestInFlight = true;
      try {
        await callbackRef.current();
      } catch {
      } finally {
        isRequestInFlight = false;
      }
    }

    const interval = setInterval(() => { void poll(); }, intervalMs);
    const subscription = AppState.addEventListener("change", (state) => {
      const wasActive = isActive;
      isActive = state === "active";
      if (isActive && !wasActive) void poll();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled, intervalMs]);
}
