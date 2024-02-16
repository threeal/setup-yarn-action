import { exec } from "@actions/exec";

async function enable() {
  await exec("corepack", ["enable", "yarn"]);
}

export default { enable };
