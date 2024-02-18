import * as core from "@actions/core";
import { hashFile } from "hasha";
import fs from "node:fs";
import os from "node:os";
import yarn from "./yarn.js";

interface CacheInformation {
  key: string;
  paths: string[];
}

export async function getCacheInformation(): Promise<
  CacheInformation | undefined
> {
  core.info("Getting Yarn version...");
  const version = await yarn.version();
  core.info(`Yarn version: ${version}`);

  core.info("Calculating lock file hash...");
  if (!fs.existsSync("yarn.lock")) {
    core.warning(`Lock file not found, skipping cache`);
    return undefined;
  }
  const lockFileHash = await hashFile("yarn.lock", { algorithm: "md5" });
  core.info(`Lock file hash: ${lockFileHash}`);

  return {
    key: `yarn-install-action-${os.type()}-${version}-${lockFileHash}`,
    paths: [
      await yarn.getConfig("cacheFolder"),
      await yarn.getConfig("deferredVersionFolder"),
      await yarn.getConfig("installStatePath"),
      await yarn.getConfig("patchFolder"),
      await yarn.getConfig("pnpUnpluggedFolder"),
      await yarn.getConfig("virtualFolder"),
      ".yarn",
      ".pnp.cjs",
      ".pnp.loader.mjs",
    ],
  };
}
