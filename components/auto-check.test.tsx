/** @vitest-environment jsdom */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoCheck } from "./auto-check";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function visibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

describe("AutoCheck", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockClear();
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("asks once when it opens on a visible page", async () => {
    const run = vi.fn().mockResolvedValue(0);
    render(<AutoCheck routeIds={["a", "b"]} intervalMinutes={5} run={run} language="de" />);
    await flush();

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(["a", "b"]);
  });

  it("does not ask while the page is hidden", async () => {
    visibility("hidden");
    const run = vi.fn().mockResolvedValue(0);
    render(<AutoCheck routeIds={["a"]} intervalMinutes={5} run={run} language="de" />);
    await flush();

    expect(run).not.toHaveBeenCalled();
  });

  it("asks again after each interval while the page stays visible", async () => {
    const run = vi.fn().mockResolvedValue(0);
    render(<AutoCheck routeIds={["a"]} intervalMinutes={5} run={run} language="de" />);
    await flush();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(run).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(run).toHaveBeenCalledTimes(3);
  });

  it("stops asking once the page is hidden", async () => {
    const run = vi.fn().mockResolvedValue(0);
    render(<AutoCheck routeIds={["a"]} intervalMinutes={5} run={run} language="de" />);
    await flush();

    act(() => visibility("hidden"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    });

    expect(run).toHaveBeenCalledTimes(1);
  });

  it("asks right away when the page comes back after the interval", async () => {
    const run = vi.fn().mockResolvedValue(0);
    render(<AutoCheck routeIds={["a"]} intervalMinutes={5} run={run} language="de" />);
    await flush();

    act(() => visibility("hidden"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
    });
    act(() => visibility("visible"));
    await flush();

    expect(run).toHaveBeenCalledTimes(2);
  });

  it("does not ask twice within a minute when the page flickers", async () => {
    const run = vi.fn().mockResolvedValue(0);
    render(<AutoCheck routeIds={["a"]} intervalMinutes={5} run={run} language="de" />);
    await flush();

    act(() => visibility("hidden"));
    act(() => visibility("visible"));
    await flush();

    expect(run).toHaveBeenCalledTimes(1);
  });

  it("reloads the page data only when a check was written", async () => {
    const run = vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(2);
    render(<AutoCheck routeIds={["a"]} intervalMinutes={5} run={run} language="de" />);
    await flush();
    expect(refresh).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("says that it is checking while the answer is pending", async () => {
    let finish: (count: number) => void = () => {};
    const run = vi.fn().mockReturnValue(new Promise<number>((resolve) => (finish = resolve)));
    render(<AutoCheck routeIds={["a"]} intervalMinutes={5} run={run} language="de" />);
    await flush();

    expect(screen.getByRole("status").textContent).toBe("Prüfe gerade …");

    await act(async () => finish(0));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("survives a failing run and tries again at the next interval", async () => {
    const run = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValue(0);
    render(<AutoCheck routeIds={["a"]} intervalMinutes={5} run={run} language="de" />);
    await flush();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });

    expect(run).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does nothing without routes", async () => {
    const run = vi.fn().mockResolvedValue(0);
    render(<AutoCheck routeIds={[]} intervalMinutes={5} run={run} language="de" />);
    await flush();

    expect(run).not.toHaveBeenCalled();
  });
});
