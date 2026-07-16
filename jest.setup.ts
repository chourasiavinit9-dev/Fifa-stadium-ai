import "@testing-library/jest-dom";
import { jest } from "@jest/globals";

// Mock global fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Suppress console.error in tests unless needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning:") || args[0].includes("act("))
    ) {
      return;
    }
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
