import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));
vi.mock("./WeatherBanner", () => ({
  default: () => <div data-testid="weather-banner" />,
}));

import Navigation from "./Navigation";

const LINKS = [
  ["Our Story", "/our-story"],
  ["Details", "/details"],
  ["Theme", "/theme"],
  ["RSVP", "/rsvp"],
  ["Registry", "/registry"],
  ["FAQ", "/faq"],
] as const;

describe("Navigation", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/");
  });

  it("renders nothing on the password page", () => {
    usePathname.mockReturnValue("/password");
    const { container } = render(<Navigation />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the home link, every top-level link and the weather banner", () => {
    render(<Navigation />);
    expect(screen.getByRole("link", { name: "HOME" })).toHaveAttribute("href", "/");
    const desktopLinks = within(screen.getAllByRole("list")[0]).getAllByRole("link");
    expect(desktopLinks.map((a) => [a.textContent, a.getAttribute("href")])).toEqual(LINKS);
    expect(screen.getByTestId("weather-banner")).toBeInTheDocument();
  });

  it("toggles the mobile menu", async () => {
    render(<Navigation />);
    expect(screen.getAllByRole("list")).toHaveLength(1);

    const toggle = screen.getByRole("button", { name: "Toggle menu" });
    await userEvent.click(toggle);
    expect(screen.getAllByRole("list")).toHaveLength(2);

    await userEvent.click(toggle);
    expect(screen.getAllByRole("list")).toHaveLength(1);
  });

  it("closes the mobile menu when a mobile link is clicked", async () => {
    render(<Navigation />);
    await userEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    const mobileList = screen.getAllByRole("list")[1];
    const faq = within(mobileList).getByRole("link", { name: "FAQ" });
    // Stop jsdom from attempting a real navigation; next/link still runs onClick.
    faq.addEventListener("click", (e) => e.preventDefault());
    await userEvent.click(faq);
    expect(screen.getAllByRole("list")).toHaveLength(1);
  });

  it("closes the mobile menu when the route changes", async () => {
    const { rerender } = render(<Navigation />);
    await userEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    expect(screen.getAllByRole("list")).toHaveLength(2);

    usePathname.mockReturnValue("/details");
    rerender(<Navigation />);
    expect(screen.getAllByRole("list")).toHaveLength(1);
  });
});
