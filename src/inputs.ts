import { getBooleanInput, getInput } from "@actions/core";

export interface Inputs {
  version: string;
  cache: boolean;
}

export function getInputs(): Inputs {
  return {
    version: getInput("version"),
    cache: getBooleanInput("cache"),
  };
}
