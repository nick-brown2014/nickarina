import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RegistryPage from "./page";

describe("RegistryPage", () => {
  it("lists each charity with a Donate link", () => {
    render(<RegistryPage />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Rocky Mountain Immigrant Advocacy Network",
      "The Delores Project",
      "Native American Rights Fund",
    ]);
    const donate = screen.getAllByRole("link", { name: "Donate" });
    expect(donate.map((a) => a.getAttribute("href"))).toEqual([
      "https://www.rmian.org/donate",
      "https://secure.qgiv.com/for/thedeloresproject/",
      "https://narf.org",
    ]);
  });

  it("links to the Zola registry", () => {
    render(<RegistryPage />);
    expect(screen.getByRole("link", { name: "View Our Registry" })).toHaveAttribute(
      "href",
      "https://www.zola.com/registry/karinaandnick2026"
    );
  });

  it("opens all links in a new tab safely", () => {
    render(<RegistryPage />);
    for (const a of screen.getAllByRole("link")) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
