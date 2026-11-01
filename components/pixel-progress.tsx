const blocks = 20;

// A progress bar built from square blocks, so it stays a pixel graphic at any width.
export function PixelProgress({ value, label }: { value: number; label: string }) {
  const clamped = Math.min(1, Math.max(0, value));
  const filled = Math.floor(clamped * blocks + 1e-9);

  return (
    <div className="flex flex-col gap-2">
      <p className="font-pixel text-sm tabular-nums">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(clamped * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="flex h-5 w-full gap-0.5"
      >
        {Array.from({ length: blocks }, (_, index) => (
          <span
            key={index}
            data-block={index < filled ? "filled" : "empty"}
            className={`h-full flex-1 ${index < filled ? "bg-signal" : "bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
}
