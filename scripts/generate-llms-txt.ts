/**
 * Writes public/llms.txt and public/llms-full.txt from the pricing table,
 * FAQ copy, and service-area list so published prices cannot drift.
 *
 *   npm run llms
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderLlmsFullTxt, renderLlmsTxt } from '../src/data/aio-summary.ts';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public');
const outputs: [string, string][] = [
  ['llms.txt', renderLlmsTxt()],
  ['llms-full.txt', renderLlmsFullTxt()]
];

for (const [name, body] of outputs) {
  const output = path.join(dir, name);
  writeFileSync(output, body);
  console.log(`Wrote ${output}`);
}
