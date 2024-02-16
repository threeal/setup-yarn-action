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

async function install() {
  const env = process.env;

  // Prevent `yarn install` from outputting group log messages.
  env["GITHUB_ACTIONS"] = "";
  env["FORCE_COLOR"] = "true";

  // Prevent no lock file causing errors.
  env["CI"] = "";

  return exec("corepack", ["yarn", "install"], { env });
}

export default { disableGlobalCache, enable, install };
