import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ThemePage from "./page";

const PINIT = "https://assets.pinterest.com/js/pinit.js";
const pinitScripts = () => document.querySelectorAll(`script[src="${PINIT}"]`);

describe("ThemePage", () => {
  it("renders the theme copy and both Pinterest board embeds", () => {
    render(<ThemePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Theme" })).toBeInTheDocument();
    const boards = screen.getAllByRole("link", { name: /Pinterest Board$/ });
    expect(boards).toHaveLength(2);
    for (const b of boards) {
      expect(b).toHaveAttribute("data-pin-do", "embedBoard");
      expect(b.getAttribute("href")).toMatch(/^https:\/\/www\.pinterest\.com\/krackerbarrel\//);
    }
  });

  it("links to the maid of honor's email", () => {
    render(<ThemePage />);
    expect(screen.getByRole("link", { name: "helenawernst@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:helenawernst@gmail.com"
    );
  });

  it("injects the Pinterest script on mount and removes it on unmount", () => {
    const { unmount } = render(<ThemePage />);
    const scripts = pinitScripts();
    expect(scripts).toHaveLength(1);
    expect((scripts[0] as HTMLScriptElement).async).toBe(true);
    unmount();
    expect(pinitScripts()).toHaveLength(0);
  });
});
