export type StopMatch = { id: string; name: string };

export const stopSearchDelayMs = 300;

export function stopSearchQuery(value: string) {
  const trimmed = value.trim();
  return trimmed.length >= 3 ? trimmed : null;
}

export function createStopSearch(
  search: (query: string, signal: AbortSignal) => Promise<StopMatch[]>,
  delay = stopSearchDelayMs,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  return (value: string, onResult: (places: StopMatch[]) => void) => {
    if (timer) clearTimeout(timer);
    controller?.abort();
    controller = undefined;

    const query = stopSearchQuery(value);
    if (!query) {
      onResult([]);
      return;
    }

    const current = new AbortController();
    controller = current;
    timer = setTimeout(() => {
      void search(query, current.signal)
        .then((places) => {
          if (!current.signal.aborted) onResult(places);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    }, delay);
  };
}
