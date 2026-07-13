import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Nach jedem Test das gerenderte DOM aufräumen (Test-Isolation).
afterEach(() => {
  cleanup();
});
