import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/exec", () => ({
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

    const version = await getYarnVersion();

    expect(getExecOutput).toHaveBeenCalledTimes(1);
    expect(getExecOutput).toHaveBeenCalledWith("yarn", ["--version"], {
      silent: true,
    });

    expect(version).toEqual("1.2.3");
  });

  it("should get Yarn version using Corepack", async () => {
    const { getExecOutput } = await import("@actions/exec");
    const { getYarnVersion } = await import("./version.js");

    const version = await getYarnVersion({ corepack: true });

    expect(getExecOutput).toHaveBeenCalledTimes(1);
    expect(getExecOutput).toHaveBeenCalledWith(
      "corepack",
      ["yarn", "--version"],
      {
        silent: true,
      },
    );

    expect(version).toEqual("1.2.3");
  });
});
