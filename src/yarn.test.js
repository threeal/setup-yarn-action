import { jest } from "@jest/globals";

let enabled = false;
let installed = false;

jest.unstable_mockModule("@actions/exec", () => ({
  default: {
    ...jest.requireActual("@actions/exec"),
    exec: async (commandLine, args) => {
      switch ([commandLine, ...args].join(" ")) {
        case "corepack enable yarn":
          enabled = true;
          break;

        case "corepack yarn install":
          if (!enabled) throw new Error("Yarn is not enabled");
          installed = true;
          break;
      }
    },
  },
}));

describe("install dependencies", () => {
  beforeEach(() => {
    enabled = false;
    installed = false;
  });

  it("should install dependencies", async () => {
    const { install } = await import("./yarn.mjs");
    await install();
    expect(installed).toBe(true);
  });
});
