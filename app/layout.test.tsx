import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Special_Elite: () => ({ variable: "font-special-elite-var", className: "x" }),
}));
vi.mock("@/app/components/Navigation", () => ({
  default: () => <nav data-testid="navigation" />,
}));
vi.mock("@/app/components/PageFader", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-fader">{children}</div>
  ),
}));

import RootLayout, { metadata } from "./layout";

describe("RootLayout", () => {
  it("exports the site metadata", () => {
    expect(metadata.title).toBe("Nick & Karina | October 31, 2026");
    expect(metadata.description).toMatch(/Della Terra Mountain Chateau in Estes Park, Colorado/);
  });

  it("renders navigation and wraps children in the page fader", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>child</p>
      </RootLayout>
    );
    expect(html).toMatch(/^<html lang="en">/);
    expect(html).toContain('class="font-special-elite-var antialiased"');
    expect(html).toContain('data-testid="navigation"');
    expect(html).toMatch(/<div data-testid="page-fader"><p>child<\/p><\/div>/);
    expect(html.indexOf("navigation")).toBeLessThan(html.indexOf("page-fader"));
  });
});
