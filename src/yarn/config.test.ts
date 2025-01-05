import { getExecOutput } from "@actions/exec";
import { expect, it, vi } from "vitest";
import { getYarnConfig } from "./config.js";

vi.mock("@actions/exec", () => ({ getExecOutput: vi.fn() }));

it("should get Yarn config", async () => {
  vi.mocked(getExecOutput).mockResolvedValueOnce({
    exitCode: 0,
    stdout: `{"key":"globalFolder","effective":"/.yarn/berry","source":"<default>","description":"Folder where all system-global files are stored","type":"ABSOLUTE_PATH","default":"/.yarn/berry"}\n`,
    stderr: "",
  });

  const prom = getYarnConfig("globalFolder");
  await expect(prom).resolves.toEqual("/.yarn/berry");

  expect(getExecOutput).toHaveBeenCalledOnce();
  expect(getExecOutput).toHaveBeenCalledWith(
    "yarn",
    ["config", "globalFolder", "--json"],
    {
      silent: true,
    },
  );
});
