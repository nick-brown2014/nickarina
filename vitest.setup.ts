import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

// next/image validates width/height for non-static imports; Vite turns image
// imports into plain URL strings, so render a bare <img> in unit tests.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority: _priority,
    fill: _fill,
    ...rest
  }: {
    src: string | { src: string };
    alt: string;
    priority?: boolean;
    fill?: boolean;
  }) => {
    void _priority;
    void _fill;
    return createElement("img", {
      src: typeof src === "string" ? src : src.src,
      alt,
      ...rest,
    });
  },
}));

afterEach(() => {
  cleanup();
  if (typeof window !== "undefined") {
    window.sessionStorage.clear();
    document.body.style.paddingTop = "";
  }
});
