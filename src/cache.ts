import * as core from "@actions/core";
import { hashFile } from "hasha";
import fs from "node:fs";
import os from "node:os";
import yarn from "./yarn.js";

export async function getCacheKey(): Promise<string | undefined> {
  core.info("Getting Yarn version...");
  const version = await yarn.version();

  core.info("Calculating lock file hash...");
  if (!fs.existsSync("yarn.lock")) {
    core.warning(`Lock file not found, skipping cache`);
    return undefined;
  }
  const lockFileHash = await hashFile("yarn.lock", { algorithm: "md5" });

  const cacheKey = `yarn-install-action-${os.type()}-${version}-${lockFileHash}`;
  core.info(`Using cache key: ${cacheKey}`);

  return cacheKey;
}

export async function getCachePaths(): Promise<string[]> {
  core.info("Getting Yarn cache folder...");
  const yarnCacheFolder = await yarn.getConfig("cacheFolder");

  core.info("Getting Yarn deferred version folder...");
  const yarnDefferedVersionFolder = await yarn.getConfig(
    "deferredVersionFolder",
  );

  core.info("Getting Yarn install state path...");
  const yarnInstallStatePath = await yarn.getConfig("installStatePath");

  core.info("Getting Yarn patch folder...");
  const yarnPatchFolder = await yarn.getConfig("patchFolder");

  core.info("Getting Yarn PnP unplugged folder...");
  const yarnPnpUnpluggedFolder = await yarn.getConfig("pnpUnpluggedFolder");

  core.info("Getting Yarn virtual folder...");
  const yarnVirtualFolder = await yarn.getConfig("virtualFolder");

  const cachePaths = [
    yarnCacheFolder,
    yarnDefferedVersionFolder,
    yarnInstallStatePath,
    yarnPatchFolder,
    yarnPnpUnpluggedFolder,
    yarnVirtualFolder,
    ".yarn",
    ".pnp.cjs",
    ".pnp.loader.mjs",
  ];
  core.info(`Using cache paths: ${JSON.stringify(cachePaths, null, 4)}`);

  return cachePaths;
}
