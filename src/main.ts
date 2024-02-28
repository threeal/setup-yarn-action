import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { getCacheKey, getCachePaths } from "./cache.js";
import { corepackAssertYarnVersion, corepackEnableYarn } from "./corepack.js";
import { setYarnVersion, yarnInstall } from "./yarn/index.js";
import { getInputs } from "./inputs.js";

export async function main(): Promise<void> {
  core.info("Getting action inputs...");
  const inputs = getInputs();

  core.info("Enabling Yarn...");
  try {
    await corepackEnableYarn();
    await corepackAssertYarnVersion();
  } catch (err) {
    core.setFailed(`Failed to enable Yarn: ${err.message}`);
    return;
  }

  if (inputs.version != "") {
    core.info("Setting Yarn version...");
    try {
      await setYarnVersion(inputs.version);
      await corepackAssertYarnVersion();
    } catch (err) {
      core.setFailed(`Failed to set Yarn version: ${err.message}`);
      return;
    }
  }

  let cacheKey: string;
  let cachePaths: string[];
  if (inputs.cache) {
    core.startGroup("Getting cache key");
    try {
      cacheKey = await getCacheKey();
    } catch (err) {
      core.endGroup();
      core.setFailed(`Failed to get cache key: ${err.message}`);
      return;
    }
    core.endGroup();

    core.startGroup("Getting cache paths");
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

  if (inputs.cache) {
    core.startGroup("Saving cache");
    try {
      await cache.saveCache(cachePaths.slice(), cacheKey);
    } catch (err) {
      core.endGroup();
      core.setFailed(`Failed to save cache: ${err.message}`);
      return;
    }
    core.endGroup();
  }
}
