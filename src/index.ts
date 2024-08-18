import { logError } from "gha-utils";
import { main } from "./main.js";

main().catch((err) => {
  logError(err);
  process.exit(1);
});
