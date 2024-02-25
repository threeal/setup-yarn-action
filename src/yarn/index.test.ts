import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
  getExecOutput: jest.fn(),
}));

jest.unstable_mockModule("./version.js", () => ({
  getYarnVersion: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("enable Yarn", () => {
  beforeEach(async () => {
    const { getYarnVersion } = await import("./version.js");

    jest.mocked(getYarnVersion).mockResolvedValue("1.2.3");
  });

  it("should enable Yarn", async () => {
    const { exec } = await import("@actions/exec");
    const { enableYarn } = await import("./index.js");

    await expect(enableYarn()).resolves.toBeUndefined();

    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith("corepack", ["enable", "yarn"], {
      silent: true,
    });
  });

  describe("with different Yarn versions", () => {
    beforeEach(async () => {
      const { getYarnVersion } = await import("./version.js");

      jest.mocked(getYarnVersion).mockImplementation(async (options) => {
        return options?.corepack ? "1.2.3" : "1.2.4";
      });
    });

    it("should failed to enable Yarn", async () => {
      const { enableYarn } = await import("./index.js");

      await expect(enableYarn()).rejects.toThrow(
        "The `yarn` command is using different version of Yarn, expected `1.2.3` but got `1.2.4`",
      );
    });
  });
});

it("should get Yarn config", async () => {
  const { getExecOutput } = await import("@actions/exec");
  const { getYarnConfig } = await import("./index.js");

  jest.mocked(getExecOutput).mockResolvedValueOnce({
    exitCode: 0,
    stdout: `{"key":"globalFolder","effective":"/.yarn/berry","source":"<default>","description":"Folder where all system-global files are stored","type":"ABSOLUTE_PATH","default":"/.yarn/berry"}\n`,
    stderr: "",
  });

  const value = await getYarnConfig("globalFolder");

  expect(getExecOutput).toHaveBeenCalledTimes(1);
  expect(getExecOutput).toHaveBeenCalledWith(
    "corepack",
    ["yarn", "config", "globalFolder", "--json"],
    {
      silent: true,
    },
  );

  expect(value).toEqual("/.yarn/berry");
});
