import { exec } from "@actions/exec";
import { logError, logInfo, logWarning } from "gha-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { printYarnInstallOutput, yarnInstall } from "./install.js";

vi.mock("@actions/exec", () => ({ exec: vi.fn() }));

vi.mock("gha-utils", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarning: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("print Yarn install package output", () => {
  it("should print info output", () => {
    printYarnInstallOutput({
      type: "info",
      displayName: "YN0000",
      indent: ". ",
      data: "\u001b[1mYarn 4.1.0\u001b[22m",
    });

    expect(logInfo).toHaveBeenCalledOnce();
    expect(logInfo).toHaveBeenCalledWith(
      "YN0000: . \u001b[1mYarn 4.1.0\u001b[22m",
    );

    expect(logWarning).toHaveBeenCalledTimes(0);
    expect(logError).toHaveBeenCalledTimes(0);
  });

  it("should print warning output", () => {
    printYarnInstallOutput({
      type: "warning",
      displayName: "YN0000",
      indent: "│ ",
      data: "ESM support for PnP uses the experimental loader API and is therefore experimental",
    });

    expect(logWarning).toHaveBeenCalledOnce();
    expect(logWarning).toHaveBeenCalledWith(
      "ESM support for PnP uses the experimental loader API and is therefore experimental (YN0000)",
    );

    expect(logInfo).toHaveBeenCalledTimes(0);
    expect(logError).toHaveBeenCalledTimes(0);
  });

  it("should print error output", () => {
    printYarnInstallOutput({
      type: "error",
      displayName: "YN0028",
      indent: ". ",
      data: "The lockfile would have been created by this install, which is explicitly forbidden.",
    });

    expect(logError).toHaveBeenCalledOnce();
    expect(logError).toHaveBeenCalledWith(
      "The lockfile would have been created by this install, which is explicitly forbidden. (YN0028)",
    );

    expect(logInfo).toHaveBeenCalledTimes(0);
    expect(logWarning).toHaveBeenCalledTimes(0);
  });
});

it("should install package using Yarn", async () => {
  vi.mocked(exec).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (commandLine, args, options) => {
      if (options?.listeners?.stdline !== undefined) {
        options.listeners.stdline(
          `{"type":"info","name":null,"displayName":"YN0000","indent":"","data":"└ Completed"}`,
        );
      }
      return 0;
    },
  );

  await yarnInstall();

  expect(exec).toHaveBeenCalledTimes(1);

  const execCall = vi.mocked(exec).mock.calls[0];
  expect(execCall).toHaveLength(3);
  expect(execCall[0]).toBe("yarn");
  expect(execCall[1]).toEqual(["install", "--json"]);

  expect(logInfo).toHaveBeenCalledOnce();
  expect(logInfo).toHaveBeenCalledWith("YN0000: └ Completed");
});
