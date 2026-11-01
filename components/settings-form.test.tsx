/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SettingsForm } from "./settings-form";

describe("SettingsForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("offers the check interval, with one minute for trying the clock", () => {
    render(<SettingsForm language="de" minutes={5} windowMinutes={60} failed={false} />);

    const field = screen.getByRole("spinbutton", { name: "Intervall" });
    expect(field.getAttribute("min")).toBe("1");
    expect(field.getAttribute("value")).toBe("5");
    expect(
      screen.getByText("Minuten zwischen den Prüfungen. Gewöhnlich mindestens 5. 1 Minute nur zum Ausprobieren."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Routen" }).getAttribute("href")).toBe("/routes?all=1");
  });

  it("offers the window around the arrival time", () => {
    render(<SettingsForm language="de" minutes={5} windowMinutes={45} failed={false} />);

    const field = screen.getByRole("spinbutton", { name: "Zeitfenster vor der Ankunft" });
    expect(field.getAttribute("name")).toBe("window");
    expect(field.getAttribute("min")).toBe("10");
    expect(field.getAttribute("max")).toBe("240");
    expect(field.getAttribute("value")).toBe("45");
    expect(screen.getByText(/früher als die eingestellte Ankunftsuhrzeit/)).toBeTruthy();
  });

  it("uses the English sentences", () => {
    render(<SettingsForm language="en" minutes={1} windowMinutes={60} failed={false} />);

    expect(screen.getByRole("spinbutton", { name: "Interval" }).getAttribute("value")).toBe("1");
    expect(screen.getByRole("spinbutton", { name: "Window before arrival" })).toBeTruthy();
    expect(screen.getByText(/1 minute is only for trying the clock/)).toBeTruthy();
  });

  it("shows whether the on-route mode is on and offers the other choice", () => {
    render(<SettingsForm language="de" minutes={5} windowMinutes={60} failed={false} onRoute="on" />);

    expect(screen.getByText("On-Route-Modus")).toBeTruthy();
    expect(screen.getByText("Der Modus ist an.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ausschalten" })).toBeTruthy();

    cleanup();
    render(<SettingsForm language="en" minutes={5} windowMinutes={60} failed={false} onRoute="off" />);

    expect(screen.getByText("The mode is off.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Turn on" })).toBeTruthy();
  });
});
