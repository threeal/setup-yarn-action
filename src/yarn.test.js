import { jest } from "@jest/globals";

let installed = false;
jest.unstable_mockModule("@actions/exec", () => ({
  default: {
    ...jest.requireActual("@actions/exec"),
    exec: async (commandLine, args) => {
      if (commandLine == "corepack" && args.length > 0) {
        if (args[0] == "yarn" && args.length > 1) {
          if (args[1] == "install") installed = true;
        }
      }
    },
  },
}));

describe("install dependencies", () => {
  beforeEach(() => {
    installed = false;
  });

  it("should install dependencies", async () => {
    const { install } = await import("./yarn.mjs");
    await install();
    expect(installed).toBe(true);
  });
});
