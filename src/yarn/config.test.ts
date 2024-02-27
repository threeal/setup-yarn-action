import { jest } from "@jest/globals";
import "jest-extended";

jest.unstable_mockModule("@actions/exec", () => ({
  getExecOutput: jest.fn(),
}));

it("should get Yarn config", async () => {
  const { getExecOutput } = await import("@actions/exec");
  const { getYarnConfig } = await import("./config.js");

  jest.mocked(getExecOutput).mockResolvedValueOnce({
    exitCode: 0,
    stdout: `{"key":"globalFolder","effective":"/.yarn/berry","source":"<default>","description":"Folder where all system-global files are stored","type":"ABSOLUTE_PATH","default":"/.yarn/berry"}\n`,
    stderr: "",
  });

  const prom = getYarnConfig("globalFolder");
  await expect(prom).resolves.toEqual("/.yarn/berry");

  expect(getExecOutput).toHaveBeenCalledExactlyOnceWith(
    "yarn",
    ["config", "globalFolder", "--json"],
    {
      silent: true,
    },
  );
});
