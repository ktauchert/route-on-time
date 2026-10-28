/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DeleteRoute } from "./delete-route";
import { QuickStart } from "./quick-start";

describe("DeleteRoute", () => {
  afterEach(() => {
    cleanup();
  });

  it("asks before deleting", () => {
    render(<DeleteRoute id="1" language="de" />);

    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));

    expect(screen.getByText("Diese Route löschen?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wirklich löschen" })).toBeTruthy();
  });
});

describe("QuickStart", () => {
  afterEach(() => {
    cleanup();
  });

  it("offers a new route and only the routes passed in", () => {
    render(
      <QuickStart
        language="de"
        routes={[{ id: "1", name: null, startName: "Alex", zielName: "Zoo", weekdays: ["mon"] }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Schnellstart" }));

    expect(screen.getByRole("link", { name: "Neue Route" }).getAttribute("href")).toBe(
      "/routen/neu",
    );
    expect(screen.getByRole("link", { name: "Alex → Zoo" }).getAttribute("href")).toBe(
      "/routen/1",
    );
    expect(screen.getByRole("button", { name: "Schnellstart" }).parentElement?.className).toContain(
      "md:hidden",
    );
  });
});
