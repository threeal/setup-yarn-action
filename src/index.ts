import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { getCacheInformation } from "./cache.js";
import yarn from "./yarn.js";

async function main(): Promise<void> {
  await core.group("Enabling Yarn", async () => {
    await yarn.enable();
  });

  const cacheInfo = await core.group(
    "Getting cache information",
    getCacheInformation,
  );

  if (cacheInfo !== undefined) {
    const cacheFound = await core.group("Restoring cache", async () => {
      const cacheId = await cache.restoreCache(
        cacheInfo.paths.slice(),
        cacheInfo.key,
      );
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
    return yarn.install();
  });

  if (cacheInfo !== undefined) {
    await core.group("Saving cache", async () => {
      return cache.saveCache(cacheInfo.paths.slice(), cacheInfo.key);
    });
  }
}

main().catch((err) => core.setFailed(err));
