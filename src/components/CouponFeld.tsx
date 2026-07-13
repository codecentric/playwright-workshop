import { useState, type FormEvent } from "react";
import {
  pruefeCoupon,
  type CouponErgebnis,
} from "../domain/coupon.js";

interface CouponFeldProps {
  onEingeloest: (rabattProzent: number) => void;
  /** Prüf-Funktion — im Test injizierbar, sonst der echte fetch-Aufruf. */
  pruefe?: (code: string) => Promise<CouponErgebnis>;
}

type Meldung =
  | { art: "erfolg"; rabattProzent: number }
  | { art: "fehler" }
  | null;

export function CouponFeld({
  onEingeloest,
  pruefe = (code) => pruefeCoupon(code),
}: CouponFeldProps) {
  const [code, setCode] = useState("");
  const [meldung, setMeldung] = useState<Meldung>(null);

  const einloesen = async (event: FormEvent) => {
    event.preventDefault();
    const ergebnis = await pruefe(code);
    if (ergebnis.valid) {
      onEingeloest(ergebnis.rabattProzent);
      setMeldung({ art: "erfolg", rabattProzent: ergebnis.rabattProzent });
    } else {
      setMeldung({ art: "fehler" });
    }
  };

  return (
    <form onSubmit={einloesen} className="coupon-feld" aria-label="Gutschein">
      <label>
        Gutschein-Code
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      <button type="submit">Einlösen</button>

      {meldung?.art === "erfolg" && (
        <p className="coupon-erfolg">Rabatt: {meldung.rabattProzent} %</p>
      )}
      {meldung?.art === "fehler" && (
        <p role="alert">Gutschein-Code ungültig.</p>
      )}
    </form>
  );
}
