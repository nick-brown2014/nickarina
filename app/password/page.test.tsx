import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PasswordPage from "./page";

const fetchMock = vi.fn();

describe("PasswordPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  const input = () => screen.getByPlaceholderText("Enter password");

  it("renders a required password input", () => {
    render(<PasswordPage />);
    expect(input()).toHaveAttribute("type", "password");
    expect(input()).toBeRequired();
  });

  it("only reveals the submit button once something is typed", async () => {
    render(<PasswordPage />);
    const submit = screen.getByRole("button", { name: /enter/i });
    expect(submit).toHaveClass("opacity-0");
    await userEvent.type(input(), "x");
    expect(submit).toHaveClass("opacity-100");
  });

  it("toggles password visibility", async () => {
    render(<PasswordPage />);
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input()).toHaveAttribute("type", "text");
    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input()).toHaveAttribute("type", "password");
  });

  it("posts the password and follows the hidden home link on success", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(<PasswordPage />);

    await userEvent.type(input(), "karinanick{enter}");

    expect(fetchMock).toHaveBeenCalledWith("/api/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "karinanick" }),
    });
    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    expect(clickSpy.mock.contexts[0]).toHaveAttribute("href", "/");
    expect(screen.queryByText("Wrong password")).not.toBeInTheDocument();
  });

  it("shows an error and clears the input on a wrong password", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    render(<PasswordPage />);
    await userEvent.type(input(), "nope{enter}");
    expect(await screen.findByText("Wrong password")).toBeInTheDocument();
    expect(input()).toHaveValue("");
  });

  it("clears a previous error on resubmit", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    let resolve!: (v: { ok: boolean }) => void;
    fetchMock.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<PasswordPage />);

    await userEvent.type(input(), "nope{enter}");
    await screen.findByText("Wrong password");
    await userEvent.type(input(), "karinanick{enter}");
    expect(screen.queryByText("Wrong password")).not.toBeInTheDocument();
    resolve({ ok: true });
  });
});
