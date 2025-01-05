import { exec, getExecOutput } from "@actions/exec";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getYarnVersion, setYarnVersion } from "./version.js";

vi.mock("@actions/exec", () => ({
  exec: vi.fn(),
  getExecOutput: vi.fn(),
}));

describe("get Yarn version", () => {
  beforeEach(() => {
    vi.mocked(getExecOutput).mockReset().mockResolvedValueOnce({
      exitCode: 0,
      stdout: "1.2.3",
      stderr: "",
    });
  });

  it("should get Yarn version", async () => {
    await expect(getYarnVersion()).resolves.toEqual("1.2.3");

    expect(getExecOutput).toHaveBeenCalledOnce();
    expect(getExecOutput).toHaveBeenCalledWith("yarn", ["--version"], {
      silent: true,
    });
  });

  it("should get Yarn version using Corepack", async () => {
    const prom = getYarnVersion({ corepack: true });
    await expect(prom).resolves.toEqual("1.2.3");

    expect(getExecOutput).toHaveBeenCalledOnce();
    expect(getExecOutput).toHaveBeenCalledWith(
      "corepack",
      ["yarn", "--version"],
      {
        silent: true,
      },
    );
  });
});

describe("set Yarn version", () => {
  beforeEach(() => {
    vi.mocked(exec).mockReset();
  });

  it("should set Yarn version", async () => {
    const prom = setYarnVersion("stable");
    await expect(prom).resolves.toBeUndefined();

    expect(exec).toHaveBeenCalledOnce();
    expect(exec).toHaveBeenCalledWith("yarn", ["set", "version", "stable"], {
      silent: true,
    });
  });
});
