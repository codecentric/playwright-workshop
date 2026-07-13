import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CouponFeld } from "./CouponFeld.js";

function renderCoupon(
  overrides: Partial<React.ComponentProps<typeof CouponFeld>> = {},
) {
  const props = {
    onEingeloest: vi.fn(),
    pruefe: vi.fn().mockResolvedValue({ valid: true, rabattProzent: 15 }),
    ...overrides,
  };
  render(<CouponFeld {...props} />);
  return props;
}

async function einloesen(code: string) {
  await userEvent.type(screen.getByLabelText(/gutschein-code/i), code);
  await userEvent.click(screen.getByRole("button", { name: /einlösen/i }));
}

describe("CouponFeld", () => {
  it("meldet einen gültigen Coupon mit Rabatt-Prozent nach außen", async () => {
    const props = renderCoupon();
    await einloesen("HAPPY");

    expect(props.pruefe).toHaveBeenCalledWith("HAPPY");
    expect(props.onEingeloest).toHaveBeenCalledWith(15);
    expect(await screen.findByText(/15\s*%/)).toBeInTheDocument();
  });

  it("zeigt bei ungültigem Coupon einen Fehler und meldet nichts nach außen", async () => {
    const props = renderCoupon({
      pruefe: vi.fn().mockResolvedValue({ valid: false, rabattProzent: 0 }),
    });
    await einloesen("XYZ");

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(props.onEingeloest).not.toHaveBeenCalled();
  });
});
