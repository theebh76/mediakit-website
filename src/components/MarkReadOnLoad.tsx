"use client";

import { useEffect } from "react";
import { useReadTracker } from "./useReadTracker";

export function MarkReadOnLoad({ link }: { link: string }) {
  const { markRead, hydrated } = useReadTracker();
  useEffect(() => {
    if (hydrated && link) markRead(link);
  }, [hydrated, link, markRead]);
  return null;
}
