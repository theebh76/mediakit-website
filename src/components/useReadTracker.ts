"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mediakit:read-articles:v1";
const EVENT = "mediakit:read-changed";

function loadSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    // ignore
  }
  return new Set();
}

function saveSet(s: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s)));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    // ignore
  }
}

export function useReadTracker() {
  const [readSet, setReadSet] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReadSet(loadSet());
    setHydrated(true);

    const sync = () => setReadSet(loadSet());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const markRead = useCallback((link: string, value: boolean = true) => {
    setReadSet((prev) => {
      const next = new Set(prev);
      if (value) next.add(link);
      else next.delete(link);
      saveSet(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setReadSet(() => {
      const next = new Set<string>();
      saveSet(next);
      return next;
    });
  }, []);

  const isRead = useCallback((link: string) => readSet.has(link), [readSet]);

  return { isRead, markRead, clearAll, hydrated, count: readSet.size };
}
