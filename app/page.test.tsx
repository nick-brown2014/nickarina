import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("shows the couple, date and venue", () => {
    render(<Home />);
    expect(screen.getByAltText("Nicholas Brown")).toBeInTheDocument();
    expect(screen.getByAltText("Karina Ernst")).toBeInTheDocument();
    expect(screen.getByText("October 31, 2026")).toBeInTheDocument();
    expect(screen.getByText("Della Terra Mountain Chateau")).toBeInTheDocument();
    expect(screen.getByText("Estes Park, Colorado")).toBeInTheDocument();
  });

  it("links to the RSVP page", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "RSVP" })).toHaveAttribute("href", "/rsvp");
  });
});
