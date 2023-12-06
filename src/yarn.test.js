import { jest } from "@jest/globals";

let installed = false;
jest.unstable_mockModule("@actions/exec", () => ({
  default: {
    ...jest.requireActual("@actions/exec"),
    exec: async (commandLine, args) => {
      switch ([commandLine, ...args].join(" ")) {
        case "corepack yarn install":
          installed = true;
          break;
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
