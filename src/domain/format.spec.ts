import { describe, it, expect } from "vitest";
import { formatiereEuro } from "./format.js";

describe("formatiereEuro", () => {
  it("ganze Zahl → '8,00 €'", () => {
    expect(formatiereEuro(8)).toBe("8,00 €");
  });

  it("Nachkommastellen → '8,50 €'", () => {
    expect(formatiereEuro(8.5)).toBe("8,50 €");
  });

  it("rundet auf zwei Nachkommastellen → '16,40 €'", () => {
    expect(formatiereEuro(16.4)).toBe("16,40 €");
  });
});
