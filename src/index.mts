import cache from "@actions/cache";
import core from "@actions/core";
import exec from "@actions/exec";
import { hashFile } from "hasha";
import os from "os";
import process from "process";

async function main() {
  await core.group("Enabling Yarn", async () => {
    return exec.exec("corepack", ["enable", "yarn"]);
  });

  const lockFileHash = await core.group(
    "Calculating lock file hash",
    async () => {
      try {
        const hash = await hashFile("yarn.lock", { algorithm: "md5" });
        core.info(`Hash: ${hash}`);
        return hash;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "unknown error";
        core.warning(`Unable to calculate lock file hash: ${errMsg}`);
        core.warning(`Skipping cache`);
        return undefined;
      }
    },
  );

  const cachePaths = [".yarn", ".pnp.cjs", ".pnp.loader.mjs"];
  const cacheKey =
    lockFileHash !== undefined
      ? `yarn-install-action-${os.type()}-${lockFileHash}`
      : undefined;

  if (cacheKey !== undefined) {
    const cacheFound = await core.group("Restoring cache", async () => {
      const cacheId = await cache.restoreCache(cachePaths.slice(), cacheKey);
      if (cacheId === undefined) {
        core.warning("Cache not found");
        return false;
      }
      return true;
    });

    if (cacheFound) {
      core.info("Cache restored successfully");
      return;
    }
  }

  await core.group("Disabling global cache", async () => {
    return exec.exec("corepack", [
      "yarn",
      "config",
      "set",
      "enableGlobalCache",
      "false",
    ]);
  });

  await core.group("Installing dependencies", async () => {
    // Prevent `yarn install` from outputting group log messages.
    const env = process.env as { [key: string]: string };
    env["GITHUB_ACTIONS"] = "";
    env["FORCE_COLOR"] = "true";

    return exec.exec("corepack", ["yarn", "install"], { env });
  });

  if (cacheKey !== undefined) {
    await core.group("Saving cache", async () => {
      return cache.saveCache(cachePaths.slice(), cacheKey);
    });
  }
}

main().catch((err) => core.setFailed(err));
