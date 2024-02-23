import { jest } from "@jest/globals";

jest.unstable_mockModule("@actions/exec", () => ({
  exec: jest.fn(),
}));

it("should execute a Yarn command", async () => {
  const { exec } = await import("@actions/exec");
  const { execYarn } = await import("./exec.js");

  await execYarn(["do", "something"]);

  expect(exec).toHaveBeenCalledTimes(1);
  expect(exec).toHaveBeenCalledWith("corepack", ["yarn", "do", "something"], {
    silent: true,
  });
});
