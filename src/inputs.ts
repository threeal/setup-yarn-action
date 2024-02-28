import { getBooleanInput, getInput } from "@actions/core";

interface Inputs {
  version: string;
  cache: boolean;
}

export function getInputs(): Inputs {
  return {
    version: getInput("version"),
    cache: getBooleanInput("cache"),
  };
}
