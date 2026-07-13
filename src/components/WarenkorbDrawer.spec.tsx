import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WarenkorbDrawer } from "./WarenkorbDrawer.js";
import type { Warenkorb } from "../domain/warenkorb.js";

const warenkorb: Warenkorb = [
  { id: "mojito", name: "Mojito", einzelpreis: 8.5, menge: 2 },
  { id: "ipanema", name: "Ipanema", einzelpreis: 6, menge: 1 },
];

function renderDrawer(overrides: Partial<React.ComponentProps<typeof WarenkorbDrawer>> = {}) {
  const props = {
    warenkorb,
    offen: true,
    gesamtpreis: 23,
    onSchliessen: vi.fn(),
    onMengeAendern: vi.fn(),
    onEntfernen: vi.fn(),
    onBestellen: vi.fn(),
    ...overrides,
  };
  render(<WarenkorbDrawer {...props} />);
  return props;
}

describe("WarenkorbDrawer", () => {
  it("ist geschlossen nicht als Dialog erreichbar", () => {
    renderDrawer({ offen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("zeigt bei leerem Warenkorb einen Hinweis", () => {
    renderDrawer({ warenkorb: [], gesamtpreis: 0 });
    expect(screen.getByText(/warenkorb ist leer/i)).toBeInTheDocument();
  });

  it("listet die Positionen mit Menge und Zeilensumme", () => {
    renderDrawer();
    const mojitoZeile = screen.getByRole("listitem", { name: "Mojito" });
    expect(within(mojitoZeile).getByText(/menge: 2/i)).toBeInTheDocument();
    expect(within(mojitoZeile).getByText("17,00 €")).toBeInTheDocument();
  });

  it("zeigt den Gesamtpreis", () => {
    renderDrawer();
    expect(
      within(screen.getByRole("dialog")).getByText("23,00 €"),
    ).toBeInTheDocument();
  });

  it("erhöht die Menge über den +-Button", async () => {
    const props = renderDrawer();
    await userEvent.click(
      screen.getByRole("button", { name: /menge erhöhen für mojito/i }),
    );
    expect(props.onMengeAendern).toHaveBeenCalledWith("mojito", 3);
  });

  it("verringert die Menge über den –-Button", async () => {
    const props = renderDrawer();
    await userEvent.click(
      screen.getByRole("button", { name: /menge verringern für mojito/i }),
    );
    expect(props.onMengeAendern).toHaveBeenCalledWith("mojito", 1);
  });

  it("entfernt eine Position", async () => {
    const props = renderDrawer();
    await userEvent.click(
      screen.getByRole("button", { name: /mojito entfernen/i }),
    );
    expect(props.onEntfernen).toHaveBeenCalledWith("mojito");
  });

  it("schließt den Drawer", async () => {
    const props = renderDrawer();
    await userEvent.click(screen.getByRole("button", { name: /schließen/i }));
    expect(props.onSchliessen).toHaveBeenCalledTimes(1);
  });

  // Flakiness-Quelle #1: „Hydration" — der Bestellen-Button ist von Anfang an
  // sichtbar und nicht disabled, verarbeitet Klicks aber erst nach einem
  // zufälligen Delay von 200–500 ms (simuliert nachgeladene Handler-Logik).
  describe("Bestellen-Button und Hydration", () => {
    beforeEach((): void => {
      vi.useFakeTimers();
      vi.spyOn(Math, "random").mockReturnValue(0.5);
    });

    afterEach((): void => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("ist von Anfang an nicht deaktiviert", () => {
      renderDrawer();
      expect(
        screen.getByRole("button", { name: /^bestellen$/i }),
      ).toBeEnabled();
    });

    it("verarbeitet Klicks vor Ablauf des Hydration-Delays nicht", async () => {
      const props = renderDrawer();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      fireEvent.click(screen.getByRole("button", { name: /^bestellen$/i }));

      expect(props.onBestellen).not.toHaveBeenCalled();
    });

    it("verarbeitet Klicks nach Ablauf des Hydration-Delays", async () => {
      const props = renderDrawer();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });
      fireEvent.click(screen.getByRole("button", { name: /^bestellen$/i }));

      expect(props.onBestellen).toHaveBeenCalledTimes(1);
    });

    it("hält die Untergrenze des Delays bei 200 ms ein", async () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const props = renderDrawer();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(199);
      });
      fireEvent.click(screen.getByRole("button", { name: /^bestellen$/i }));
      expect(props.onBestellen).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2);
      });
      fireEvent.click(screen.getByRole("button", { name: /^bestellen$/i }));
      expect(props.onBestellen).toHaveBeenCalledTimes(1);
    });

    it("überschreitet die Obergrenze des Delays von 500 ms nicht", async () => {
      vi.spyOn(Math, "random").mockReturnValue(0.999999);
      const props = renderDrawer();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      fireEvent.click(screen.getByRole("button", { name: /^bestellen$/i }));

      expect(props.onBestellen).toHaveBeenCalledTimes(1);
    });
  });
});
