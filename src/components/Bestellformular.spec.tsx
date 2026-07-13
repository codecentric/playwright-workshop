import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Bestellformular } from "./Bestellformular.js";

function renderFormular(
  overrides: Partial<React.ComponentProps<typeof Bestellformular>> = {},
) {
  const props = {
    trinkgeld: 0,
    onTrinkgeldChange: vi.fn(),
    onAbschicken: vi.fn(),
    ...overrides,
  };
  render(<Bestellformular {...props} />);
  return props;
}

describe("Bestellformular", () => {
  it("zeigt die Felder Name, Tischnummer, Trinkgeld und Notiz", () => {
    renderFormular();
    expect(screen.getByLabelText(/auf welchen namen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tischnummer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trinkgeld/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notiz an die bar/i)).toBeInTheDocument();
  });

  it("loggt bei leerem Namen einen Error über console.error mit Hinweis auf den Namen", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderFormular();
    await userEvent.click(
      screen.getByRole("button", { name: /jetzt bestellen/i }),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/namen/i),
      }),
    );
    expect(errorSpy.mock.calls[0][0]).toBeInstanceOf(Error);
    errorSpy.mockRestore();
  });

  it("zeigt bei leerem Namen keinen Fehler-Alert im UI an", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderFormular();
    await userEvent.click(
      screen.getByRole("button", { name: /jetzt bestellen/i }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("schickt bei leerem Namen nicht ab", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const props = renderFormular();
    await userEvent.click(
      screen.getByRole("button", { name: /jetzt bestellen/i }),
    );
    expect(props.onAbschicken).not.toHaveBeenCalled();
  });

  it("schickt die eingegebenen Daten ab, wenn ein Name vorhanden ist", async () => {
    const props = renderFormular();
    await userEvent.type(screen.getByLabelText(/auf welchen namen/i), "Marco");
    await userEvent.type(screen.getByLabelText(/tischnummer/i), "7");
    await userEvent.type(
      screen.getByLabelText(/notiz an die bar/i),
      "extra Eis",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /jetzt bestellen/i }),
    );

    expect(props.onAbschicken).toHaveBeenCalledTimes(1);
    expect(props.onAbschicken).toHaveBeenCalledWith({
      name: "Marco",
      tischnummer: "7",
      notiz: "extra Eis",
    });
  });

  it("meldet Trinkgeld-Änderungen nach außen", async () => {
    const props = renderFormular();
    await userEvent.type(screen.getByLabelText(/trinkgeld/i), "3");
    expect(props.onTrinkgeldChange).toHaveBeenLastCalledWith(3);
  });
});
