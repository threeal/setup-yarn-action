import { getInput } from "ghakit/io";

export interface Inputs {
  version: string;
  cache: boolean;
}

export function getInputs(): Inputs {
  return {
    version: getInput("version"),
    cache: getInput("cache") === "true",
  };
}
