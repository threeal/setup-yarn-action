import { exec } from "@actions/exec";

async function disableGlobalCache() {
  return exec("corepack", [
    "yarn",
    "config",
    "set",
    "enableGlobalCache",
    "false",
  ]);
}

async function enable() {
  await exec("corepack", ["enable", "yarn"]);
}

export default { disableGlobalCache, enable };
