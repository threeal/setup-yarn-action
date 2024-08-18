import { jest } from "@jest/globals";

jest.unstable_mockModule("gha-utils", () => ({
  getInput: jest.fn(),
}));

beforeEach(async () => {
  const { getInput } = await import("gha-utils");

  jest.mocked(getInput).mockImplementation((name) => {
    switch (name) {
      case "cache":
        return "true";

      case "version":
        return "";
    }
    throw new Error(`unknown input: ${name}`);
  });
});

it("should get the action inputs", async () => {
  const { getInputs } = await import("./inputs.js");

  const inputs = getInputs();

  expect(inputs).toStrictEqual({ version: "", cache: true });
});
