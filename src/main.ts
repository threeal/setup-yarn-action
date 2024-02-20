import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { getCacheKey, getCachePaths } from "./cache.js";
import { enableYarn, yarnInstall } from "./yarn/index.js";

export async function main(): Promise<void> {
  core.info("Enabling Yarn...");
  await enableYarn();

  const cacheKey = await core.group("Getting cache key", getCacheKey);
  const cachePaths = await core.group("Getting cache paths", getCachePaths);

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

  await core.group("Installing dependencies", async () => {
    return yarnInstall();
  });

  await core.group("Saving cache", async () => {
    return cache.saveCache(cachePaths.slice(), cacheKey);
  });
}
