import core from "@actions/core";
import exec from "@actions/exec";
import process from "process";

async function main() {
  await core.group("Enabling Yarn", async () => {
    return exec.exec("corepack", ["enable", "yarn"]);
  });

  await core.group("Installing dependencies", async () => {
    // Prevent `yarn install` from outputting group log messages.
    const env = process.env as { [key: string]: string };
    env["GITHUB_ACTIONS"] = "";

    return exec.exec("corepack", ["yarn", "install"], { env });
  });
}

main();
