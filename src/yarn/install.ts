import * as core from "@actions/core";
import { exec } from "@actions/exec";

export interface YarnInstallOutput {
  type: "info" | "warning" | "error";
  displayName: string;
  indent: string;
  data: string;
}

export function printYarnInstallOutput(output: YarnInstallOutput): void {
  switch (output.type) {
    case "info":
      core.info(`${output.displayName}: ${output.indent}${output.data}`);
      break;
    case "warning":
      core.warning(`${output.data} (${output.displayName})`);
      break;
    case "error":
      core.error(`${output.data} (${output.displayName})`);
      break;
  }
}

export async function yarnInstall(): Promise<void> {
  const env = process.env as { [key: string]: string };

  // Prevent `yarn install` from outputting group log messages.
  env["GITHUB_ACTIONS"] = "";
  env["FORCE_COLOR"] = "true";

  // Prevent no lock file causing errors.
  env["CI"] = "";

  await exec("corepack", ["yarn", "install", "--json"], {
    env,
    silent: true,
    listeners: {
      stdline: (data) => {
        const output = JSON.parse(data) as YarnInstallOutput;
        printYarnInstallOutput(output);
      },
    },
  });
}
