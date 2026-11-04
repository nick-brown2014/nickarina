import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OurStoryPage from "./page";

describe("OurStoryPage", () => {
  it("renders the heading and placeholder copy", () => {
    render(<OurStoryPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Our Story" })).toBeInTheDocument();
    expect(screen.getByText("Our story is still being written...")).toBeInTheDocument();
  });
});
