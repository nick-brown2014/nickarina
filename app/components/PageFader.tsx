"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const FADE_MS = 500;

export default function PageFader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (!href.startsWith("/") || href.startsWith("//")) return;
      if (href === pathname) return;

      e.preventDefault();
      e.stopPropagation();
      setVisible(false);
      setPendingPath(href);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!pendingPath) return;
    const navTimer = window.setTimeout(() => {
      router.push(pendingPath);
      const fadeInTimer = window.setTimeout(() => {
        setVisible(true);
        setPendingPath(null);
      }, 100);
      return () => window.clearTimeout(fadeInTimer);
    }, FADE_MS);
    return () => window.clearTimeout(navTimer);
  }, [pendingPath, router]);

  return (
    <div
      className={visible ? "opacity-100" : "opacity-0"}
      style={{ transition: `opacity ${FADE_MS}ms ease-in-out` }}
    >
      {children}
    </div>
  );
}
