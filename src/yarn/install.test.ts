import { jest } from "@jest/globals";
import "jest-extended";

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
}));

jest.unstable_mockModule("gha-utils", () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarning: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("print Yarn install package output", () => {
  it("should print info output", async () => {
    const { logError, logInfo, logWarning } = await import("gha-utils");
    const { printYarnInstallOutput } = await import("./install.js");

    printYarnInstallOutput({
      type: "info",
      displayName: "YN0000",
      indent: ". ",
      data: "\u001b[1mYarn 4.1.0\u001b[22m",
    });

    expect(logInfo).toHaveBeenCalledExactlyOnceWith(
      "YN0000: . \u001b[1mYarn 4.1.0\u001b[22m",
    );

    expect(logWarning).toHaveBeenCalledTimes(0);
    expect(logError).toHaveBeenCalledTimes(0);
  });

  it("should print warning output", async () => {
    const { logError, logInfo, logWarning } = await import("gha-utils");
    const { printYarnInstallOutput } = await import("./install.js");

    printYarnInstallOutput({
      type: "warning",
      displayName: "YN0000",
      indent: "│ ",
      data: "ESM support for PnP uses the experimental loader API and is therefore experimental",
    });

    expect(logWarning).toHaveBeenCalledExactlyOnceWith(
      "ESM support for PnP uses the experimental loader API and is therefore experimental (YN0000)",
    );

    expect(logInfo).toHaveBeenCalledTimes(0);
    expect(logError).toHaveBeenCalledTimes(0);
  });

  it("should print error output", async () => {
    const { logError, logInfo, logWarning } = await import("gha-utils");
    const { printYarnInstallOutput } = await import("./install.js");

    printYarnInstallOutput({
      type: "error",
      displayName: "YN0028",
      indent: ". ",
      data: "The lockfile would have been created by this install, which is explicitly forbidden.",
    });

    expect(logError).toHaveBeenCalledExactlyOnceWith(
      "The lockfile would have been created by this install, which is explicitly forbidden. (YN0028)",
    );

    expect(logInfo).toHaveBeenCalledTimes(0);
    expect(logWarning).toHaveBeenCalledTimes(0);
  });
});

it("should install package using Yarn", async () => {
  const { exec } = await import("@actions/exec");
  const { logInfo } = await import("gha-utils");
  const { yarnInstall } = await import("./install.js");

  jest.mocked(exec).mockImplementation(async (commandLine, args, options) => {
    if (options?.listeners?.stdline !== undefined) {
      options?.listeners?.stdline(
        `{"type":"info","name":null,"displayName":"YN0000","indent":"","data":"└ Completed"}`,
      );
    }
    return 0;
  });

  await yarnInstall();

  expect(exec).toHaveBeenCalledTimes(1);

  const execCall = jest.mocked(exec).mock.calls[0];
  expect(execCall).toHaveLength(3);
  expect(execCall[0]).toBe("yarn");
  expect(execCall[1]).toEqual(["install", "--json"]);

  expect(logInfo).toHaveBeenCalledExactlyOnceWith("YN0000: └ Completed");
});
