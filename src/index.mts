import cache from "@actions/cache";
import core from "@actions/core";
import exec from "@actions/exec";
import { hashFile } from "hasha";
import fs from "fs";
import os from "os";
import process from "process";
import yarn from "./yarn.mjs";

async function main() {
  await core.group("Enabling Yarn", async () => {
    await yarn.enable();
  });

  const lockFileHash = await core.group(
    "Calculating lock file hash",
    async () => {
      if (!fs.existsSync("yarn.lock")) {
        core.warning(`Lock file not found, skipping cache`);
        return undefined;
      }
      const hash = await hashFile("yarn.lock", { algorithm: "md5" });
      core.info(`Hash: ${hash}`);
      return hash;
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
    return yarn.disableGlobalCache();
  });

  await core.group("Installing dependencies", async () => {
    const env = process.env as { [key: string]: string };

    // Prevent `yarn install` from outputting group log messages.
    env["GITHUB_ACTIONS"] = "";
    env["FORCE_COLOR"] = "true";

    // Prevent no lock file causing errors.
    if (lockFileHash === undefined) {
      env["CI"] = "";
    }

    return exec.exec("corepack", ["yarn", "install"], { env });
  });

  if (cacheKey !== undefined) {
    await core.group("Saving cache", async () => {
      return cache.saveCache(cachePaths.slice(), cacheKey);
    });
  }
}

main().catch((err) => core.setFailed(err));
