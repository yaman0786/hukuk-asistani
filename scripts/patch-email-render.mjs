import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const project = dirname(root);
const source = join(project, "node_modules/entities");
const target = join(project, "node_modules/@react-email/render/node_modules/entities");

// npm can hoist entities while @react-email/render still resolves it from its
// nested path. Restore that expected package location for Nitro/Rolldown.
if (existsSync(source) && !existsSync(join(target, "lib/decode.js"))) {
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
}
