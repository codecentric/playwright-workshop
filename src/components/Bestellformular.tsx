import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

export interface Bestelldaten {
  name: string;
  tischnummer: string;
  notiz: string;
}

interface BestellformularProps {
  trinkgeld: number;
  onTrinkgeldChange: (trinkgeld: number) => void;
  onAbschicken: (daten: Bestelldaten) => void;
}

const FEHLER_NAME_LEER = "Bitte gib einen Namen an.";

function istLeer(text: string): boolean {
  return text.trim() === "";
}

export function Bestellformular({
  trinkgeld,
  onTrinkgeldChange,
  onAbschicken,
}: BestellformularProps) {
  const [name, setName] = useState("");
  const [tischnummer, setTischnummer] = useState("");
  const [notiz, setNotiz] = useState("");

  const absenden = (event: FormEvent): void => {
    event.preventDefault();
    if (istLeer(name)) {
      console.error(new Error(FEHLER_NAME_LEER));
      return;
    }
    onAbschicken({ name, tischnummer, notiz });
  };

  return (
    <form onSubmit={absenden} noValidate aria-label="Bestellung">
      <label>
        Auf welchen Namen?
        <input
          type="text"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setName(event.target.value)
          }
        />
      </label>

      <label>
        Tischnummer
        <input
          type="number"
          value={tischnummer}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setTischnummer(event.target.value)
          }
        />
      </label>

      <label>
        Trinkgeld (€)
        <input
          type="number"
          value={trinkgeld}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onTrinkgeldChange(Number(event.target.value))
          }
        />
      </label>

      <label>
        Notiz an die Bar
        <textarea
          value={notiz}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setNotiz(event.target.value)
          }
        />
      </label>

      <button type="submit">Jetzt bestellen</button>
    </form>
  );
}
