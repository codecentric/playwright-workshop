import { describe, it, expect, vi } from "vitest";
import { lokaleCouponPruefung, pruefeCoupon } from "./coupon.js";

describe("lokaleCouponPruefung (Fallback)", () => {
  it("'HAPPY' ist gültig mit 15% Rabatt", () => {
    expect(lokaleCouponPruefung("HAPPY")).toEqual({
      valid: true,
      rabattProzent: 15,
    });
  });

  it("ist case-insensitive", () => {
    expect(lokaleCouponPruefung("happy").valid).toBe(true);
  });

  it("unbekannter Code → ungültig, 0%", () => {
    expect(lokaleCouponPruefung("XYZ")).toEqual({
      valid: false,
      rabattProzent: 0,
    });
  });
});

describe("pruefeCoupon (fetch mit Fallback)", () => {
  it("nutzt die Antwort des Servers, wenn der Call erfolgreich ist", async () => {
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true, rabattProzent: 20 }),
    });

    await expect(pruefeCoupon("SOMMER", fakeFetch as unknown as typeof fetch))
      .resolves.toEqual({ valid: true, rabattProzent: 20 });
    expect(fakeFetch).toHaveBeenCalledWith(
      "/api/validate-coupon",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("fällt bei Netzwerkfehler auf die lokale Prüfung zurück", async () => {
    const fakeFetch = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(
      pruefeCoupon("HAPPY", fakeFetch as unknown as typeof fetch),
    ).resolves.toEqual({ valid: true, rabattProzent: 15 });
  });

  it("fällt bei Server-Fehler (nicht ok) auf die lokale Prüfung zurück", async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(
      pruefeCoupon("XYZ", fakeFetch as unknown as typeof fetch),
    ).resolves.toEqual({ valid: false, rabattProzent: 0 });
  });
});
