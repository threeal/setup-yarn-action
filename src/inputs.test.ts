import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/core", () => ({
  getBooleanInput: jest.fn(),
}));

beforeEach(async () => {
  const { getBooleanInput } = await import("@actions/core");

  jest.mocked(getBooleanInput).mockImplementation((name) => {
    switch (name) {
      case "cache":
        return true;
    }
    throw new Error(`unknown input: ${name}`);
  });
});

it("should get the action inputs", async () => {
  const { getInputs } = await import("./inputs.js");

  const inputs = getInputs();

  expect(inputs).toStrictEqual({ cache: true });
});
