import { exec } from "@actions/exec";
import { addPath } from "gha-utils";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import { corepackAssertYarnVersion, corepackEnableYarn } from "./corepack.js";
import { getYarnVersion } from "./yarn/index.js";

vi.mock("@actions/exec", () => ({ exec: vi.fn() }));
vi.mock("gha-utils", () => ({ addPath: vi.fn() }));
vi.mock("node:fs", () => ({ mkdirSync: vi.fn() }));
vi.mock("./yarn/index.js", () => ({ getYarnVersion: vi.fn() }));

describe("assert Yarn version enabled by Corepack", () => {
  it("should not throw an error if Yarn versions are the same", async () => {
    vi.mocked(getYarnVersion).mockResolvedValue("2.3.4");
    await expect(corepackAssertYarnVersion()).resolves.toBeUndefined();
  });

  it("should throw an error if using Yarn classic", async () => {
    vi.mocked(getYarnVersion).mockResolvedValue("1.2.3");

    await expect(corepackAssertYarnVersion()).rejects.toThrow(
      "This action does not support Yarn classic (1.2.3)",
    );
  });

  it("should throw an error if Yarn versions are different", async () => {
    vi.mocked(getYarnVersion).mockImplementation(async (options) => {
      return options?.corepack ? "2.3.4" : "2.3.5";
    });

    await expect(corepackAssertYarnVersion()).rejects.toThrow(
      "The `yarn` command is using a different version of Yarn, expected `2.3.4` but got `2.3.5`",
    );
  });
});

describe("enable Yarn using Corepack", () => {
  it("should enable Yarn", async () => {
    await expect(corepackEnableYarn()).resolves.toBeUndefined();
    const installDir = path.join(homedir(), ".corepack");

    expect(mkdirSync).toHaveBeenCalledOnce();
    expect(mkdirSync).toHaveBeenCalledWith(installDir, {
      recursive: true,
    });

    expect(exec).toHaveBeenCalledOnce();
    expect(exec).toHaveBeenCalledWith(
      "corepack",
      ["enable", "--install-directory", installDir, "yarn"],
      {
        silent: true,
      },
    );

    expect(addPath).toHaveBeenCalledOnce();
    expect(addPath).toHaveBeenCalledWith(installDir);
  });
});
