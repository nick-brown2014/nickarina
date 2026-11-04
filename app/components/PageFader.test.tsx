import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { usePathname, push } = vi.hoisted(() => ({
  usePathname: vi.fn(),
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname,
  useRouter: () => ({ push }),
}));

import PageFader from "./PageFader";

function renderWith(children: React.ReactNode) {
  const utils = render(<PageFader>{children}</PageFader>);
  const wrapper = utils.container.firstChild as HTMLElement;
  return { ...utils, wrapper };
}

describe("PageFader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePathname.mockReturnValue("/");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children visibly with a 500ms opacity transition", () => {
    const { wrapper } = renderWith(<p>hello</p>);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(wrapper).toHaveClass("opacity-100");
    expect(wrapper.style.transition).toBe("opacity 500ms ease-in-out");
  });

  it("fades out, navigates after 500ms, then fades back in", () => {
    const { wrapper } = renderWith(<a href="/details">Details</a>);
    const event = fireEvent.click(screen.getByText("Details"));

    expect(event).toBe(false);
    expect(wrapper).toHaveClass("opacity-0");
    expect(push).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));
    expect(push).toHaveBeenCalledWith("/details");

    act(() => vi.advanceTimersByTime(100));
    expect(wrapper).toHaveClass("opacity-100");
  });

  it("handles clicks on elements nested inside a link", () => {
    renderWith(
      <a href="/rsvp">
        <span>inner</span>
      </a>
    );
    fireEvent.click(screen.getByText("inner"));
    act(() => vi.advanceTimersByTime(500));
    expect(push).toHaveBeenCalledWith("/rsvp");
  });

  it.each([
    ["external links", <a key="a" href="https://example.com">x</a>, {}],
    ["protocol-relative links", <a key="a" href="//example.com">x</a>, {}],
    ["hash links", <a key="a" href="#venues">x</a>, {}],
    ["mailto links", <a key="a" href="mailto:a@b.c">x</a>, {}],
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- PageFader intercepts raw anchors
    ["the current page", <a key="a" href="/">x</a>, {}],
    ["target=_blank", <a key="a" href="/faq" target="_blank">x</a>, {}],
    ["download links", <a key="a" href="/file.csv" download>x</a>, {}],
    ["anchors without href", <a key="a">x</a>, {}],
    ["non-anchor elements", <button key="a">x</button>, {}],
    ["meta-clicks", <a key="a" href="/faq">x</a>, { metaKey: true }],
    ["ctrl-clicks", <a key="a" href="/faq">x</a>, { ctrlKey: true }],
    ["shift-clicks", <a key="a" href="/faq">x</a>, { shiftKey: true }],
    ["alt-clicks", <a key="a" href="/faq">x</a>, { altKey: true }],
    ["non-primary buttons", <a key="a" href="/faq">x</a>, { button: 1 }],
  ])("ignores %s", (_label, el, init) => {
    const { wrapper } = renderWith(el);
    const target = screen.getByText("x");
    target.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(target, init);
    act(() => vi.advanceTimersByTime(1000));
    expect(push).not.toHaveBeenCalled();
    expect(wrapper).toHaveClass("opacity-100");
  });

  it("ignores clicks that were already default-prevented", () => {
    renderWith(<a href="/faq">x</a>);
    const target = screen.getByText("x");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    event.preventDefault();
    target.dispatchEvent(event);
    act(() => vi.advanceTimersByTime(1000));
    expect(push).not.toHaveBeenCalled();
  });

  it("removes its document listener on unmount", () => {
    const { unmount } = renderWith(<a href="/faq">x</a>);
    const link = screen.getByText("x");
    unmount();
    document.body.appendChild(link);
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    act(() => vi.advanceTimersByTime(1000));
    expect(push).not.toHaveBeenCalled();
    link.remove();
  });
});
