import { getInput } from "gha-utils";
import { beforeEach, expect, it, vi } from "vitest";
import { getInputs } from "./inputs.js";

vi.mock("gha-utils", () => ({ getInput: vi.fn() }));

beforeEach(() => {
  vi.mocked(getInput).mockImplementation((name) => {
    switch (name) {
      case "cache":
        return "true";

      case "version":
        return "";
    }
    throw new Error(`unknown input: ${name}`);
  });
});

it("should get the action inputs", () => {
  const inputs = getInputs();
  expect(inputs).toStrictEqual({ version: "", cache: true });
});
