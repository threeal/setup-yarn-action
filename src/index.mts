import cache from "@actions/cache";
import core from "@actions/core";
import exec from "@actions/exec";
import process from "process";

async function main() {
  await core.group("Enabling Yarn", async () => {
    return exec.exec("corepack", ["enable", "yarn"]);
  });

  const cachePaths = [".yarn"];
  const cacheKey = "yarn-install-action";

  await core.group("Restoring cache", async () => {
    return cache.restoreCache(cachePaths, cacheKey);
  });

  await core.group("Installing dependencies", async () => {
    // Prevent `yarn install` from outputting group log messages.
    const env = process.env as { [key: string]: string };
    env["GITHUB_ACTIONS"] = "";
    env["FORCE_COLOR"] = "true";

    return exec.exec("corepack", ["yarn", "install"], { env });
  });

  await core.group("Saving cache", async () => {
    return cache.saveCache(cachePaths, cacheKey);
  });
}

main();
