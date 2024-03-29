import { jest } from "@jest/globals";
import "jest-extended";

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
  getExecOutput: jest.fn(),
}));

describe("get Yarn version", () => {
  beforeEach(async () => {
    const { getExecOutput } = await import("@actions/exec");

    jest.mocked(getExecOutput).mockReset().mockResolvedValueOnce({
      exitCode: 0,
      stdout: "1.2.3",
      stderr: "",
    });
  });

  it("should get Yarn version", async () => {
    const { getExecOutput } = await import("@actions/exec");
    const { getYarnVersion } = await import("./version.js");

    await expect(getYarnVersion()).resolves.toEqual("1.2.3");
    expect(getExecOutput).toHaveBeenCalledExactlyOnceWith(
      "yarn",
      ["--version"],
      {
        silent: true,
      },
    );
  });

  it("should get Yarn version using Corepack", async () => {
    const { getExecOutput } = await import("@actions/exec");
    const { getYarnVersion } = await import("./version.js");

    const prom = getYarnVersion({ corepack: true });
    await expect(prom).resolves.toEqual("1.2.3");

    expect(getExecOutput).toHaveBeenCalledExactlyOnceWith(
      "corepack",
      ["yarn", "--version"],
      {
        silent: true,
      },
    );
  });
});

describe("set Yarn version", () => {
  beforeEach(async () => {
    const { exec } = await import("@actions/exec");

    jest.mocked(exec).mockReset();
  });

  it("should set Yarn version", async () => {
    const { exec } = await import("@actions/exec");
    const { setYarnVersion } = await import("./version.js");

    const prom = setYarnVersion("stable");
    await expect(prom).resolves.toBeUndefined();

    expect(exec).toHaveBeenCalledExactlyOnceWith(
      "yarn",
      ["set", "version", "stable"],
      {
        silent: true,
      },
    );
  });
});
