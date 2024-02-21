import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { getCacheKey, getCachePaths } from "./cache.js";
import { enableYarn, yarnInstall } from "./yarn/index.js";

export async function main(): Promise<void> {
  core.info("Enabling Yarn...");
  try {
    await enableYarn();
  } catch (err) {
    core.setFailed(`Failed to enable Yarn: ${err.message}`);
    return;
  }

  core.startGroup("Getting cache key");
  let cacheKey: string;
  try {
    cacheKey = await getCacheKey();
  } catch (err) {
    core.endGroup();
    core.setFailed(`Failed to get cache key: ${err.message}`);
    return;
  }
  core.endGroup();

  core.startGroup("Getting cache paths");
  let cachePaths: string[];
  try {
    cachePaths = await getCachePaths();
  } catch (err) {
    core.endGroup();
    core.setFailed(`Failed to get cache paths: ${err.message}`);
    return;
  }
  core.endGroup();

  core.startGroup("Restoring cache");
  let cacheFound: boolean;
  try {
    const cacheId = await cache.restoreCache(cachePaths.slice(), cacheKey);
    cacheFound = cacheId != undefined;
    if (!cacheFound) {
      core.warning("Cache not found");
    }
  } catch (err) {
    core.endGroup();
    core.setFailed(`Failed to restore cache: ${err.message}`);
    return;
  }
  core.endGroup();

  if (cacheFound) {
    core.info("Cache restored successfully");
    return;
  }

  core.startGroup("Installing dependencies");
  try {
    await yarnInstall();
  } catch (err) {
    core.endGroup();
    core.setFailed(`Failed to install dependencies: ${err.message}`);
    return;
  }
  core.endGroup();

  await core.group("Saving cache", async () => {
    return cache.saveCache(cachePaths.slice(), cacheKey);
  });
}
