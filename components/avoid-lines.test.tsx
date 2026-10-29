/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvoidLines } from "./avoid-lines";

const found = [
  { name: "S7", product: "suburban" },
  { name: "S2", product: "suburban" },
  { name: "S25", product: "suburban" },
  { name: "S7", product: "suburban" },
  { name: "RE1", product: "regional" },
  { name: "U2", product: "subway" },
];

function setup(overrides: Record<string, unknown> = {}) {
  const onChange = vi.fn();
  const loadLines = vi.fn().mockResolvedValue(found);
  render(
    <AvoidLines
      language="de"
      value={[]}
      onChange={onChange}
      stopIds={["start", "destination"]}
      loadLines={loadLines}
      {...overrides}
    />,
  );
  return { onChange, loadLines };
}

async function open() {
  fireEvent.click(screen.getByRole("button", { name: "Linien wählen" }));
  return screen.findByRole("dialog");
}

describe("AvoidLines", () => {
  afterEach(() => {
    cleanup();
  });

  it("cannot be opened before a start and destination are chosen", () => {
    setup({ stopIds: [] });

    expect(screen.getByRole("button", { name: "Linien wählen" })).toHaveProperty("disabled", true);
    expect(screen.getByText("Wähle zuerst Start und Ziel.")).toBeTruthy();
  });

  it("loads the lines of start and destination when it opens and offers the modes it found", async () => {
    const { loadLines } = setup();
    const dialog = await open();

    expect(loadLines).toHaveBeenCalledWith(["start", "destination"]);
    expect(await within(dialog).findByRole("button", { name: /S-Bahn/ })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: /Regionalbahn/ })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: /U-Bahn/ })).toBeTruthy();
    expect(within(dialog).queryByRole("button", { name: /Bus/ })).toBeNull();
    expect(within(dialog).getByText("Schritt 1 von 3")).toBeTruthy();
    expect(within(dialog).getByText("Welche Art von Verkehrsmittel?")).toBeTruthy();
  });

  it("walks from the kind to the line to the confirmation, then takes the line over", async () => {
    const { onChange } = setup();
    const dialog = await open();

    fireEvent.click(await within(dialog).findByRole("button", { name: /S-Bahn/ }));
    expect(within(dialog).getByText("Schritt 2 von 3")).toBeTruthy();
    const lines = within(dialog).getAllByRole("button", { pressed: false }).map((button) => button.textContent);
    expect(lines).toEqual(["S2", "S7", "S25"]);

    fireEvent.click(within(dialog).getByRole("button", { name: "S7" }));
    expect(within(dialog).getByRole("button", { name: "S7" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(within(dialog).getByRole("button", { name: "Weiter" }));

    expect(within(dialog).getByText("Schritt 3 von 3")).toBeTruthy();
    expect(within(dialog).getByText("Diese Linien werden gemieden:")).toBeTruthy();
    expect(within(dialog).getByText("S7")).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Übernehmen" }));

    expect(onChange).toHaveBeenCalledWith(["S7"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("takes nothing over when the person cancels", async () => {
    const { onChange } = setup();
    const dialog = await open();

    fireEvent.click(await within(dialog).findByRole("button", { name: /S-Bahn/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "S7" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Abbrechen" }));

    expect(onChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("goes back a step", async () => {
    setup();
    const dialog = await open();

    fireEvent.click(await within(dialog).findByRole("button", { name: /S-Bahn/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Zurück" }));

    expect(within(dialog).getByText("Schritt 1 von 3")).toBeTruthy();
  });

  it("keeps the lines from another kind when the person adds one more", async () => {
    const { onChange } = setup();
    const dialog = await open();

    fireEvent.click(await within(dialog).findByRole("button", { name: /S-Bahn/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "S7" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Weiter" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Weitere Linie" }));
    fireEvent.click(within(dialog).getByRole("button", { name: /Regionalbahn/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "RE1" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Weiter" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Übernehmen" }));

    expect(onChange).toHaveBeenCalledWith(["S7", "RE1"]);
  });

  it("starts with the lines already avoided and shows them on the field", async () => {
    const { onChange } = setup({ value: ["S7"] });

    expect(screen.getByText("S7").getAttribute("data-mode")).toBe("suburban");
    expect(screen.getByRole("button", { name: "Linien ändern" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "S7 entfernen" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("lets the person type a line that is not at the start", async () => {
    const { onChange } = setup();
    const dialog = await open();

    fireEvent.click(await within(dialog).findByRole("button", { name: /S-Bahn/ }));
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Linie von Hand" }), { target: { value: "re 8" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Hinzufügen" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Weiter" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Übernehmen" }));

    expect(onChange).toHaveBeenCalledWith(["RE8"]);
  });

  it("still lets the person type a line when the lines cannot be loaded", async () => {
    const onChange = vi.fn();
    render(
      <AvoidLines
        language="de"
        value={[]}
        onChange={onChange}
        stopIds={["start"]}
        loadLines={vi.fn().mockRejectedValue(new Error("down"))}
      />,
    );
    const dialog = await open();

    expect(await within(dialog).findByText("Die Linien konnten nicht geladen werden.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Von Hand eintragen" }));
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Linie von Hand" }), { target: { value: "S7" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Hinzufügen" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Weiter" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Übernehmen" }));

    expect(onChange).toHaveBeenCalledWith(["S7"]);
  });

  it("sends the chosen lines with the form", () => {
    const { container } = render(
      <AvoidLines language="de" value={["S7", "RE1"]} onChange={() => {}} stopIds={["a"]} loadLines={vi.fn()} />,
    );

    const values = Array.from(container.querySelectorAll("input[name=avoidLines]")).map((input) =>
      input.getAttribute("value"),
    );
    expect(values).toEqual(["S7", "RE1"]);
  });

  it("speaks English", async () => {
    setup({ language: "en" });
    fireEvent.click(screen.getByRole("button", { name: "Choose lines" }));
    const dialog = await screen.findByRole("dialog");

    expect(await within(dialog).findByText("Step 1 of 3")).toBeTruthy();
    expect(within(dialog).getByText("Which kind of transport?")).toBeTruthy();
  });
});
