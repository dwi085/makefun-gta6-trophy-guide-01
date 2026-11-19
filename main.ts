// Leonida Trophy Guide — the program that hands the guide in (Node 22, stdlib only).
//
// It copies this repository's app/ and screenshots/ into the output directory
// and writes /output/dossier.json, the summary the judge reads, using the
// vendored make.fun library. The guide itself is plain static files under
// app/ (index.html, style.css, app.js, data/trophies.json): a browser opens
// it with the network off and it fetches nothing but its own data file.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Keep vendor/makefun-frontend.ts byte-for-byte as the kit ships it: the
// scorer rebuilds the dossier with its own copy and compares the two.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, from the kit's reference/gate.json: the dossier text is
// capped at 160 KiB, at most 4 screenshots of at most 256 KiB each, app/ at
// most 993 files and directories and 48 MiB in all.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
