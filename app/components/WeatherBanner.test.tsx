import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

import WeatherBanner from "./WeatherBanner";

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(public cb: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this);
  }
}

describe("WeatherBanner", () => {
  beforeEach(() => {
    ResizeObserverMock.instances = [];
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    usePathname.mockReturnValue("/");
  });

  it("shows the weather update on public pages", () => {
    render(<WeatherBanner />);
    expect(screen.getByRole("status")).toHaveTextContent(/UPDATE:.*rainy or snowy/);
  });

  it.each(["/admin", "/admin/anything", "/password"])("is hidden on %s", (path) => {
    usePathname.mockReturnValue(path);
    const { container } = render(<WeatherBanner />);
    expect(container).toBeEmptyDOMElement();
    expect(document.body.style.paddingTop).toBe("");
  });

  it("pads the body by the banner height and tracks resizes", () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(48);
    render(<WeatherBanner />);
    expect(document.body.style.paddingTop).toBe("48px");

    const [observer] = ResizeObserverMock.instances;
    expect(observer.observe).toHaveBeenCalledWith(screen.getByRole("status"));

    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(72);
    act(() => observer.cb([], observer as unknown as ResizeObserver));
    expect(document.body.style.paddingTop).toBe("72px");
  });

  it("dismisses for the session and resets body padding", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(48);
    render(<WeatherBanner />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss weather update" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("weather-banner-dismissed")).toBe("1");
    expect(document.body.style.paddingTop).toBe("");
    expect(ResizeObserverMock.instances[0].disconnect).toHaveBeenCalled();
  });

  it("stays hidden when previously dismissed in this session", () => {
    sessionStorage.setItem("weather-banner-dismissed", "1");
    const { container } = render(<WeatherBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides every mounted banner when one is dismissed", async () => {
    render(
      <>
        <WeatherBanner />
        <WeatherBanner />
      </>
    );
    expect(screen.getAllByRole("status")).toHaveLength(2);
    await userEvent.click(screen.getAllByRole("button", { name: "Dismiss weather update" })[0]);
    expect(screen.queryAllByRole("status")).toHaveLength(0);
  });
});
