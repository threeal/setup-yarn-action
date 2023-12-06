import core from "@actions/core";
import exec from "@actions/exec";

async function main() {
  await core.group("Enabling Yarn", async () => {
    return exec.exec("corepack", ["enable", "yarn"]);
  });
  await core.group("Installing dependencies", async () => {
    return exec.exec("corepack", ["yarn", "install"]);
  });
}

main();
