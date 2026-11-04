import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DetailsPage from "./page";

describe("DetailsPage", () => {
  it("links to every section from the in-page nav", () => {
    render(<DetailsPage />);
    const nav = screen.getByRole("navigation", { name: "Page sections" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "#schedule",
      "#venues",
      "#room-blocks",
      "#transportation",
    ]);
    for (const link of links) {
      const id = link.getAttribute("href")!.slice(1);
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it("lists the three weekend events in order", () => {
    render(<DetailsPage />);
    const schedule = document.getElementById("schedule")!;
    const titles = within(schedule).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(["Costumed Welcome Party", "Ceremony & Reception", "Farewell Coffee"]);
    expect(within(schedule).getByText("Friday, October 30, 2026")).toBeInTheDocument();
    expect(within(schedule).getByText("Saturday, October 31, 2026")).toBeInTheDocument();
    expect(within(schedule).getByText("Sunday, November 1, 2026")).toBeInTheDocument();
  });

  it("opens every external link in a new tab safely", () => {
    render(<DetailsPage />);
    const external = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("http"));
    expect(external.length).toBeGreaterThan(0);
    for (const a of external) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("URL-encodes map queries", () => {
    render(<DetailsPage />);
    const venue = document.getElementById("venues")!;
    const mapLink = within(venue).getByRole("link", { name: /3501 Fall River Road/ });
    expect(mapLink).toHaveAttribute(
      "href",
      `https://maps.google.com/?q=${encodeURIComponent(
        "Della Terra Mountain Chateau, 3501 Fall River Rd, Estes Park, CO 80517"
      )}`
    );
  });

  it("has a Reserve link for each room block hotel", () => {
    render(<DetailsPage />);
    const blocks = document.getElementById("room-blocks")!;
    expect(within(blocks).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Estes Park Resort",
      "Holiday Inn Estes Park",
    ]);
    const reserve = within(blocks).getAllByRole("link", { name: "Reserve" });
    expect(reserve).toHaveLength(2);
    expect(reserve[0].getAttribute("href")).toContain("windsurfercrs.com");
    expect(reserve[1].getAttribute("href")).toContain("ihg.com");
  });

  it("lists the shuttle schedule for each leg", () => {
    render(<DetailsPage />);
    const transport = document.getElementById("transportation")!;
    const headings = within(transport).getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "To the Bull Pin (Friday)",
      "To Della Terra (Saturday)",
      "Back to the Hotels",
    ]);
    const lists = within(transport).getAllByRole("list");
    expect(lists.map((l) => within(l).getAllByRole("listitem").length)).toEqual([6, 5, 2]);
    expect(within(transport).getByText(/Arrive at Della Terra for the 5:30 PM ceremony/)).toBeInTheDocument();
  });
});
