import { logError } from "ghakit/log";
import { main } from "./main.js";

main().catch((err: unknown) => {
  logError(err);
  process.exit(1);
});
