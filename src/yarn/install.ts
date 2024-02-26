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
  await exec("yarn", ["install", "--json"], {
    silent: true,
    listeners: {
      stdline: (data) => {
        const output = JSON.parse(data) as YarnInstallOutput;
        printYarnInstallOutput(output);
      },
    },
  });
}
