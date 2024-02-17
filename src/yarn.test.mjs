import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
  getExecOutput: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it("should disable Yarn global cache", async () => {
  const { exec } = await import("@actions/exec");
  const yarn = (await import("./yarn.mjs")).default;

  await yarn.disableGlobalCache();

  expect(exec).toHaveBeenCalledTimes(1);
  expect(exec).toHaveBeenCalledWith("corepack", [
    "yarn",
    "config",
    "set",
    "enableGlobalCache",
    "false",
  ]);
});

it("should enable Yarn", async () => {
  const { exec } = await import("@actions/exec");
  const yarn = (await import("./yarn.mjs")).default;

  await yarn.enable();

  expect(exec).toHaveBeenCalledTimes(1);
  expect(exec).toHaveBeenCalledWith("corepack", ["enable", "yarn"]);
});

it("should install package using Yarn", async () => {
  const { exec } = await import("@actions/exec");
  const yarn = (await import("./yarn.mjs")).default;

  await yarn.install();

  expect(exec).toHaveBeenCalledTimes(1);
  expect(exec).toHaveBeenCalledWith("corepack", ["yarn", "install"], {
    env: {
      ...process.env,
      GITHUB_ACTIONS: "",
      FORCE_COLOR: "true",
      CI: "",
    },
  });
});

it("should get Yarn version", async () => {
  const { getExecOutput } = await import("@actions/exec");
  const yarn = (await import("./yarn.mjs")).default;

  getExecOutput.mockResolvedValue({ stdout: "1.2.3" });

  const version = await yarn.version();

  expect(getExecOutput).toHaveBeenCalledTimes(1);
  expect(getExecOutput).toHaveBeenCalledWith("corepack", ["yarn", "--version"]);

  expect(version).toEqual("1.2.3");
});
