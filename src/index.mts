import exec from "@actions/exec";

async function main() {
  await exec.exec("corepack", ["enable", "yarn"]);
  await exec.exec("corepack", ["yarn", "install"]);
}

main();
