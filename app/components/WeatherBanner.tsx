"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

const STORAGE_KEY = "weather-banner-dismissed";
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => sessionStorage.getItem(STORAGE_KEY) === "1";
const getServerSnapshot = () => true;

function dismiss() {
  sessionStorage.setItem(STORAGE_KEY, "1");
  listeners.forEach((cb) => cb());
}

export default function WeatherBanner() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const hidden = dismissed || pathname.startsWith("/admin") || pathname === "/password";

  useEffect(() => {
    if (hidden || !ref.current) {
      document.body.style.paddingTop = "";
      return;
    }
    const el = ref.current;
    const update = () => {
      document.body.style.paddingTop = `${el.offsetHeight}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.body.style.paddingTop = "";
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      ref={ref}
      role="status"
      className="bg-[#5a0d0d] text-foreground border-t border-accent/40"
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-start justify-between gap-4">
        <p className="font-[var(--font-special-elite)] text-sm tracking-wider">
          <span className="text-accent-light">UPDATE:</span> Weather is expected
          to be rainy or snowy, and below 50 degrees for both ceremony and
          cocktail hour. Please plan accordingly!
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss weather update"
          className="shrink-0 text-muted hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
