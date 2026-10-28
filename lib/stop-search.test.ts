import { describe, expect, it, vi } from "vitest";
import { createStopSearch, stopSearchQuery } from "./stop-search";

describe("stopSearchQuery", () => {
  it("waits until three characters", () => {
    expect(stopSearchQuery("al")).toBeNull();
    expect(stopSearchQuery("  a ")).toBeNull();
    expect(stopSearchQuery("ale")).toBe("ale");
    expect(stopSearchQuery("  alex ")).toBe("alex");
  });
});

describe("createStopSearch", () => {
  it("searches once, after the delay, and drops the earlier query", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const search = vi.fn(async (query: string, signal: AbortSignal) => {
      signals.push(signal);
      return [{ id: query, name: query }];
    });
    const results: string[][] = [];
    const schedule = createStopSearch(search, 300);

    schedule("al", (places) => results.push(places.map((place) => place.name)));
    schedule("ale", () => {});
    await vi.advanceTimersByTimeAsync(200);
    schedule("alex", (places) => results.push(places.map((place) => place.name)));
    await vi.advanceTimersByTimeAsync(300);

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith("alex", expect.any(AbortSignal));
    expect(signals[0]?.aborted).toBe(false);
    expect(results).toEqual([[], ["alex"]]);
    vi.useRealTimers();
  });

  it("aborts the request that was already sent when typing continues", async () => {
    vi.useFakeTimers();
    let resolveSearch: (places: Array<{ id: string; name: string }>) => void = () => {};
    const search = vi.fn(
      (_query: string, signal: AbortSignal) =>
        new Promise<Array<{ id: string; name: string }>>((resolve) => {
          resolveSearch = resolve;
          signal.addEventListener("abort", () => resolve([]));
        }),
    );
    const seen: string[][] = [];
    const schedule = createStopSearch(search, 300);

    schedule("alex", (places) => seen.push(places.map((place) => place.name)));
    await vi.advanceTimersByTimeAsync(300);
    schedule("alexa", () => {});

    expect(search).toHaveBeenCalledTimes(1);
    resolveSearch([{ id: "old", name: "old" }]);
    await vi.advanceTimersByTimeAsync(0);

    expect(seen).toEqual([]);
    vi.useRealTimers();
  });
});
