import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FaqPage from "./page";

describe("FaqPage", () => {
  it("renders the heading and every question", () => {
    render(<FaqPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Frequently Asked Questions" })).toBeInTheDocument();
    const questions = screen.getAllByRole("heading", { level: 2 });
    expect(questions).toHaveLength(8);
    expect(new Set(questions.map((q) => q.textContent)).size).toBe(8);
    expect(screen.getByText("Bats only.")).toBeInTheDocument();
  });

  it("links to internal pages that exist", () => {
    render(<FaqPage />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/details", "/details#room-blocks", "/theme"]);
  });
});
