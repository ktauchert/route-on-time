/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ConnectionBar, ModeChip } from "./connection-bar";

function leg(overrides: Record<string, unknown> = {}) {
  return {
    walking: false,
    lineName: "S7",
    product: "suburban",
    departure: "2026-10-26T08:00:00+01:00",
    arrival: "2026-10-26T08:30:00+01:00",
    ...overrides,
  };
}

const legs = [
  leg(),
  leg({ product: "regional", lineName: "RE1", departure: "2026-10-26T08:40:00+01:00", arrival: "2026-10-26T09:00:00+01:00" }),
];

describe("ConnectionBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("draws one colored part per ride and one for the wait between them", () => {
    const { container } = render(<ConnectionBar language="de" legs={legs} />);

    const parts = Array.from(container.querySelectorAll("[data-part]"));
    expect(parts.map((part) => part.getAttribute("data-part"))).toEqual(["leg", "wait", "leg"]);
    expect(parts.map((part) => part.getAttribute("data-mode"))).toEqual(["suburban", null, "regional"]);
  });

  it("sizes the parts by their minutes", () => {
    const { container } = render(<ConnectionBar language="de" legs={legs} />);

    const grows = Array.from(container.querySelectorAll<HTMLElement>("[data-part]")).map((part) =>
      Math.round(Number(part.style.flexGrow)),
    );
    expect(grows).toEqual([50, 17, 33]);
  });

  it("names the lines on the bar", () => {
    render(<ConnectionBar language="de" legs={legs} />);

    expect(screen.getByText("S7")).toBeTruthy();
    expect(screen.getByText("RE1")).toBeTruthy();
  });

  it("describes the whole connection for a screen reader", () => {
    render(<ConnectionBar language="de" legs={legs} />);

    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "S-Bahn S7 30 min, Warten 10 min, Regionalbahn RE1 20 min",
    );
  });

  it("shows nothing for a connection without times", () => {
    const { container } = render(<ConnectionBar language="de" legs={[leg({ departure: "", arrival: "" })]} />);

    expect(container.firstChild).toBeNull();
  });
});

describe("ModeChip", () => {
  afterEach(() => {
    cleanup();
  });

  it("carries the mode so the color follows it", () => {
    render(<ModeChip leg={leg({ product: "subway", lineName: "U2" })} />);

    expect(screen.getByText("U2").getAttribute("data-mode")).toBe("subway");
  });
});
